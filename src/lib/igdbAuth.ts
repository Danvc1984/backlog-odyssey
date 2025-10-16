
'use server';

let accessToken: string | null = null;
let tokenExpiration: number | null = null;

export async function getIGDBAccessToken(): Promise<string> {
    const now = Date.now();

    if (accessToken && tokenExpiration && now < tokenExpiration) {
        return accessToken;
    }
    
    const { IGDB_CLIENT_ID, IGDB_CLIENT_SECRET } = process.env;

    if (!IGDB_CLIENT_ID || !IGDB_CLIENT_SECRET) {
        throw new Error('IGDB client ID or secret is not configured.');
    }

    try {
        const response = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${IGDB_CLIENT_ID}&client_secret=${IGDB_CLIENT_SECRET}&grant_type=client_credentials`, {
            method: 'POST',
        });

        if (!response.ok) {
            throw new Error(`Failed to get IGDB access token. Status: ${response.status}`);
        }

        const data = await response.json();
        accessToken = data.access_token;
        // Set expiration to be slightly less than the actual expiration time to be safe
        tokenExpiration = now + (data.expires_in - 300) * 1000;
        
        if (!accessToken) {
             throw new Error('Access token was not found in the IGDB response.');
        }

        return accessToken;
    } catch (error: any) {
        console.error("Error fetching IGDB access token:", error.message);
        throw new Error('Could not authenticate with IGDB.');
    }
}
