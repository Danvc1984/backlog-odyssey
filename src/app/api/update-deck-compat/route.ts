
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert, App, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getSteamDeckCompat } from '@/app/api/steam/utils';

// Helper function to initialize Firebase Admin SDK within this route
function getAdminApp(): App {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
        throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_KEY environment variable');
    }

    if (getApps().length) {
        return getApps()[0];
    }
    
    const serviceAccount = JSON.parse(
        Buffer.from(serviceAccountKey, 'base64').toString('utf-8')
    );

    return initializeApp({
        credential: cert(serviceAccount as ServiceAccount),
    });
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

const BATCH_SIZE = 10; // Process 10 requests concurrently
const BATCH_DELAY = 1000; // 1-second delay between batches to be safe

export async function POST(req: NextRequest) {
    const adminApp = getAdminApp();
    const auth = getAuth(adminApp);
    const db = getFirestore(adminApp);

    const authToken = req.headers.get('authorization')?.split('Bearer ')[1];
    if (!authToken) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    let uid: string;
    try {
        const decodedToken = await auth.verifyIdToken(authToken);
        uid = decodedToken.uid;
    } catch (error) {
        console.error('Error verifying auth token:', error);
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const gamesCollectionRef = db.collection('users').doc(uid).collection('games');
        const pcGamesSnapshot = await gamesCollectionRef.where('platform', '==', 'PC').get();

        const gamesToUpdate = pcGamesSnapshot.docs.map(doc => ({
            docId: doc.id,
            ...doc.data()
        })).filter(game => game.steamAppId);

        if (gamesToUpdate.length === 0) {
            return NextResponse.json({ message: 'No PC games with Steam AppIDs found to update.' });
        }
        
        const gameChunks = chunkArray(gamesToUpdate, BATCH_SIZE);
        const batch = db.batch();
        let updatedCount = 0;

        for (const chunk of gameChunks) {
            const promises = chunk.map(game => getSteamDeckCompat(game.steamAppId));
            
            const results = await Promise.allSettled(promises);

            results.forEach((result, index) => {
                const game = chunk[index];
                if (result.status === 'fulfilled') {
                    const newCompat = result.value;
                    if (newCompat !== game.steamDeckCompat) {
                        const gameRef = gamesCollectionRef.doc(game.docId);
                        batch.update(gameRef, { steamDeckCompat: newCompat });
                        updatedCount++;
                    }
                } else {
                    console.error(`Error: Could not fetch Steam Deck compatibility for AppID ${game.steamAppId}:`, result.reason);
                }
            });

            if (gameChunks.indexOf(chunk) < gameChunks.length - 1) {
                await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
            }
        }
        
        if (updatedCount > 0) {
            await batch.commit();
        }

        return NextResponse.json({ message: `Steam Deck compatibility status updated. ${updatedCount} games were changed.` });

    } catch (error: any) {
        console.error('Error updating Steam Deck compatibility:', error);
        return NextResponse.json({ message: error.message || 'An unknown error occurred.' }, { status: 500 });
    }
}
