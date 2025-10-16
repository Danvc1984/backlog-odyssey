
import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert, App, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import axios from 'axios';
import type { Game, UserPreferences } from '@/lib/types';
import { getSteamDeckCompat, SteamDeckCompat } from '@/app/api/steam/utils';

const STEAM_API_KEY = process.env.STEAM_API_KEY;
const RAWG_API_KEY = process.env.NEXT_PUBLIC_RAWG_API_KEY;

export const maxDuration = 400; // 5 minutes, keep for the background task

// Helper function to initialize Firebase Admin SDK
function getAdminApp(): App {
    if (getApps().length) {
        return getApps()[0];
    }

    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccount) {
        throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_KEY environment variable');
    }

    const serviceAccountJson = JSON.parse(
        Buffer.from(serviceAccount, 'base64').toString('utf-8')
    );

    return initializeApp({
        credential: cert(serviceAccountJson as ServiceAccount),
    });
}

// Main background import function
async function runSteamImport(uid: string, steamId: string, importMode: 'full' | 'new', origin: string) {
    const adminApp = getAdminApp();
    const db = getFirestore(adminApp);

    try {
        const steamId64 = await resolveVanityURL(steamId);

        const userProfileRef = db.collection('users').doc(uid);
        const prefDocRef = userProfileRef.collection('preferences').doc('platform');

        const prefDocSnap = await prefDocRef.get();
        const preferences = (prefDocSnap.data() as UserPreferences) || {};
        const playsOnSteamDeck = preferences.playsOnSteamDeck || false;

        await userProfileRef.update({ steamId: steamId64 });

        if (playsOnSteamDeck && !preferences.playsOnSteamDeck) {
            await prefDocRef.set({ playsOnSteamDeck: true }, { merge: true });
        }

        let steamGames = await getOwnedGames(steamId64);
        const gamesCollectionRef = userProfileRef.collection('games');

        if (importMode === 'new') {
            const existingGamesSnapshot = await gamesCollectionRef.where('steamAppId', '!=', null).get();
            const existingSteamAppIds = new Set(existingGamesSnapshot.docs.map(doc => doc.data().steamAppId));
            steamGames = steamGames.filter(steamGame => !existingSteamAppIds.has(steamGame.appid));
        } else if (importMode === 'full') {
            const existingGamesSnapshot = await gamesCollectionRef.where('platform', '==', 'PC').get();
            const deleteBatch = db.batch();
            existingGamesSnapshot.docs.forEach(doc => deleteBatch.delete(doc.ref));
            await deleteBatch.commit();
        }

        if (steamGames.length === 0) {
            console.log('[Steam Import] No new games to import.');
            // Optionally, write a status to Firestore to notify the user.
            return;
        }

        const steamGameTitles = steamGames.map(sg => sg.name);

        let rawgDetailsMap: Record<string, any> = {};
        const rawgResponse = await fetch(`${origin}/api/rawg/get-batch-details`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ titles: steamGameTitles }),
        });
        if (rawgResponse.ok) {
            const rawgData = await rawgResponse.json();
            rawgDetailsMap = rawgData.details;
        }

        const validSteamGames = steamGames.filter(sg => rawgDetailsMap[sg.name]);
        const validGameTitles = validSteamGames.map(sg => rawgDetailsMap[sg.name].name);

        let titleToIdMap: Record<string, number> = {};
        const idResponse = await fetch(`${origin}/api/steam/get-igdb-ids`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ titles: validGameTitles }),
        });
        if (idResponse.ok) {
            titleToIdMap = (await idResponse.json()).titleToIdMap;
        }

        const processableGameDetails = validSteamGames
            .map(sg => ({ steamGame: sg, rawgDetails: rawgDetailsMap[sg.name] }))
            .filter(detail => detail.rawgDetails && titleToIdMap[detail.rawgDetails.name]);

        const uniqueIgdbIds = [...new Set(processableGameDetails.map(detail => titleToIdMap[detail.rawgDetails.name]))];
        
        let igdbIdToPlaytime: Record<number, { playtimeNormally: number | null, playtimeCompletely: number | null }> = {};
        if (uniqueIgdbIds.length > 0) {
            const timeResponse = await fetch(`${origin}/api/steam/get-batch-playtimes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: uniqueIgdbIds }),
            });
            if (timeResponse.ok) {
                igdbIdToPlaytime = (await timeResponse.json()).playtimes;
            }
        }
        
        const finalGamePromises = processableGameDetails.map(async ({ steamGame, rawgDetails }) => {
            let steamDeckCompat: SteamDeckCompat = 'unknown';
            if (playsOnSteamDeck && steamGame.appid) {
                steamDeckCompat = await getSteamDeckCompat(steamGame.appid);
            }
            return { steamGame, rawgDetails, steamDeckCompat };
        });

        const finalResults = await Promise.all(finalGamePromises);

        const batch = db.batch();
        let importedCount = 0;
        finalResults.forEach(({ steamGame, rawgDetails, steamDeckCompat }) => {
            const gameDocRef = gamesCollectionRef.doc();
            const title = rawgDetails.name;
            const igdbId = titleToIdMap[title];
            const igdbTimes = igdbId ? igdbIdToPlaytime[igdbId] : undefined;

            const newGame: Omit<Game, 'id'> = {
                userId: uid,
                title: title,
                platform: 'PC',
                genres: rawgDetails.genres?.map((g: any) => g.name) || [],
                list: 'Backlog',
                imageUrl: rawgDetails.background_image || `https://media.rawg.io/media/games/${rawgDetails.slug}.jpg`,
                releaseDate: rawgDetails.released,
                playtimeNormally: igdbTimes?.playtimeNormally ?? rawgDetails.playtime,
                playtimeCompletely: igdbTimes?.playtimeCompletely,
                steamAppId: steamGame.appid,
                steamDeckCompat: steamDeckCompat,
                dateAdded: Timestamp.now() as any,
            };
            if (!newGame.playtimeNormally) delete newGame.playtimeNormally;
            if (!newGame.playtimeCompletely) delete newGame.playtimeCompletely;

            batch.set(gameDocRef, newGame);
            importedCount++;
        });

        await batch.commit();

        const failedCount = steamGameTitles.length - importedCount;
        const message = `Import complete. Imported ${importedCount} games. Failed to find data for ${failedCount} games.`;
        console.log('[Steam Import] Success:', message);

        // Optionally, notify the user of completion via Firestore
        await userProfileRef.collection('notifications').doc('steamImport').set({
            status: 'completed',
            message: message,
            timestamp: Timestamp.now(),
        });

    } catch (error: any) {
        console.error('[Steam Import Background Task Error]', error);
        // Optionally, notify the user of failure
        const userProfileRef = db.collection('users').doc(uid);
        await userProfileRef.collection('notifications').doc('steamImport').set({
            status: 'failed',
            message: error.message || 'An unknown error occurred during import.',
            timestamp: Timestamp.now(),
        });
    }
}


export async function POST(req: NextRequest) {
    const authToken = req.headers.get('authorization')?.split('Bearer ')[1];
    if (!authToken) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    let uid: string;
    try {
        const adminApp = getAdminApp();
        const auth = getAuth(adminApp);
        const decodedToken = await auth.verifyIdToken(authToken);
        uid = decodedToken.uid;
    } catch (error) {
        console.error('Error verifying auth token:', error);
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { steamId, importMode } = await req.json();

    if (!STEAM_API_KEY || !RAWG_API_KEY) {
        return NextResponse.json({ message: 'API Keys are not configured on the server.' }, { status: 500 });
    }
    
    // "Fire and forget" - run the import in the background
    runSteamImport(uid, steamId, importMode, req.nextUrl.origin).catch(console.error);

    // Immediately return a response to the client
    return NextResponse.json({ message: 'Steam import process started in the background.' });
}


async function resolveVanityURL(vanityId: string): Promise<string> {
    if (!vanityId) {
        throw new Error('Steam ID or Vanity URL is required.');
    }
    // Already a 64-bit ID
    if (/^\d{17}$/.test(vanityId)) {
        return vanityId;
    }

    let potentialId = vanityId;

    // Handle /profiles/ URL
    if (vanityId.includes('steamcommunity.com/profiles/')) {
        potentialId = vanityId.substring(vanityId.indexOf('/profiles/') + '/profiles/'.length).split('/')[0];
    }
    // Handle /id/ URL
    else if (vanityId.includes('steamcommunity.com/id/')) {
        potentialId = vanityId.substring(vanityId.indexOf('/id/') + '/id/'.length).split('/')[0];
    }
    
    // If the extracted part is a 17-digit number, use it directly
    if (/^\d{17}$/.test(potentialId)) {
        return potentialId;
    }
    
    // Otherwise, treat it as a vanity name and resolve it
    try {
        const response = await axios.get(`https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${STEAM_API_KEY}&vanityurl=${potentialId}`);
        if (response.data.response.success === 1) {
            return response.data.response.steamid;
        } else {
            throw new Error('Could not resolve Steam vanity URL. Is your profile public and the URL correct?');
        }
    } catch (error: any) {
        console.error(`Error resolving vanity URL: ${error.message}`);
        throw new Error(`Could not resolve Steam vanity URL: ${vanityId}. Is your profile public and the URL correct?`);
    }
}

async function getOwnedGames(steamId64: string): Promise<any[]> {
    try {
        const response = await axios.get(`http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${STEAM_API_KEY}&steamid=${steamId64}&format=json&include_appinfo=true`);
        if (response.data.response && response.data.response.games) {
            return response.data.response.games;
        }
        if (response.data.response && Object.keys(response.data.response).length === 0) {
            throw new Error(`Could not fetch owned games. The Steam ID may be incorrect or the user's profile is private.`);
        }
        return [];
    } catch (error: any) {
        console.error(`Error fetching owned games: ${error.message}`);
        throw new Error(error.message || 'Could not fetch owned games from Steam.');
    }
}
