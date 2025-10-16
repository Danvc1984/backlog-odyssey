
'use server';

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getSteamDeckCompat } from '../steam/utils';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get('title');
    const checkCompat = searchParams.get('checkCompat') === 'true';

    if (!title) {
        return NextResponse.json({ message: 'Game title is required.' }, { status: 400 });
    }

    let steamAppId: number | undefined = undefined;
    let steamDeckCompat: string | undefined = undefined;

    try {
        const response = await axios.get('https://store.steampowered.com/api/storesearch/', {
            params: {
                term: title,
                l: 'english',
                cc: 'US',
            },
        });

        if (response.data && response.data.items && response.data.items.length > 0) {
            const exactMatch = response.data.items.find((item: any) => item.name.toLowerCase() === title.toLowerCase());
            const game = exactMatch || response.data.items[0];
            
            if (game.id) {
                const parsedId = parseInt(game.id, 10);
                if (!isNaN(parsedId)) {
                    steamAppId = parsedId;
                }
            }
        }
    } catch (error) {
        console.error('Error fetching from Steam API:', error);
        // Do not return error, just proceed without steam details
    }

    if (steamAppId && checkCompat) {
        steamDeckCompat = await getSteamDeckCompat(steamAppId);
    }
    
    return NextResponse.json({ steamAppId, steamDeckCompat });
}
