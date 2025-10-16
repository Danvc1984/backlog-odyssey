
'use server';

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getSteamDeckCompat, SteamDeckCompat } from '@/app/api/steam/utils';

// Helper to split array into chunks
function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

const SEARCH_BATCH_SIZE = 10;
const SEARCH_BATCH_DELAY_MS = 1100; // Just over 1 second delay

export async function POST(req: NextRequest) {
    const { titles, checkCompat } = await req.json();

    if (!titles || !Array.isArray(titles) || titles.length === 0) {
        return NextResponse.json({ message: 'Game titles are required.' }, { status: 400 });
    }

    const details: Record<string, { steamAppId?: number, steamDeckCompat?: SteamDeckCompat }> = {};

    const titleChunks = chunkArray(titles, SEARCH_BATCH_SIZE);

    for (let i = 0; i < titleChunks.length; i++) {
        const chunk = titleChunks[i];
        
        const searchPromises = chunk.map(async (title) => {
            let steamAppId: number | undefined = undefined;
            try {
                const response = await axios.get('https://store.steampowered.com/api/storesearch/', {
                    params: { term: title, l: 'english', cc: 'US' },
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
            } catch (error: any) {
                if (axios.isAxiosError(error) && (error.response?.status === 429 || error.response?.status === 503)) {
                     console.warn(`Steam API rate limit hit for title: "${title}".`);
                } else {
                    console.error(`Error fetching Steam App ID for "${title}":`, error.message);
                }
            }
            return { title, steamAppId };
        });

        const chunkResults = await Promise.all(searchPromises);
        
        for (const { title, steamAppId } of chunkResults) {
            if (steamAppId) {
                details[title] = { steamAppId };

                if (checkCompat) {
                    try {
                        const compat = await getSteamDeckCompat(steamAppId);
                        details[title].steamDeckCompat = compat;
                    } catch (error) {
                        console.warn(`Could not get Steam Deck compat for ${title} (AppID: ${steamAppId})`);
                    }
                }
            } else {
                 details[title] = {};
            }
        }

        if (i < titleChunks.length - 1) {
            await new Promise(r => setTimeout(r, SEARCH_BATCH_DELAY_MS));
        }
    }

    return NextResponse.json({ details });
}
