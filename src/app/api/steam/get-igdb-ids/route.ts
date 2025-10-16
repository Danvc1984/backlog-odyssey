
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getIGDBAccessToken } from '@/lib/igdbAuth';
import { IGDBGame } from '@/lib/igdb';

function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

const SEARCH_BATCH_SIZE = 4;
const SEARCH_BATCH_DELAY_MS = 1000;

export async function POST(req: NextRequest) {
  const { titles } = await req.json();

  if (!titles || !Array.isArray(titles) || titles.length === 0) {
    return NextResponse.json({ message: 'Missing or invalid game titles' }, { status: 400 });
  }

  try {
    const token = await getIGDBAccessToken();
    const clientId = process.env.IGDB_CLIENT_ID;

    if (!clientId) {
      return NextResponse.json({ message: 'IGDB Client ID not configured.' }, { status: 500 });
    }

    const IGDB_HEADERS = {
      'Client-ID': clientId,
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    };
    const IGDB_SEARCH_URL = 'https://api.igdb.com/v4/games';
    
    const titleToIdMap: Record<string, number> = {};
    const titleChunks = chunkArray(titles, SEARCH_BATCH_SIZE);
    
    for (let i = 0; i < titleChunks.length; i++) {
        const chunk = titleChunks[i];
        
        const searchPromises = chunk.map(async (title) => {
            const searchBody = `search "${title.replace(/"/g, '\\"')}"; fields id, name; limit 1;`;
            try {
                const searchResponse = await fetch(IGDB_SEARCH_URL, {
                    method: 'POST',
                    headers: IGDB_HEADERS,
                    body: searchBody,
                });

                if (!searchResponse.ok) {
                    return { title, id: null };
                }

                const searchResult: IGDBGame[] = await searchResponse.json();
                if (searchResult.length > 0) {
                    return { title, id: searchResult[0].id };
                } else {
                    return { title, id: null };
                }
            } catch (error: any) {
                console.error(`[get-igdb-ids] Error fetching IGDB ID for "${title}":`, error.message);
                return { title, id: null };
            }
        });

        const chunkResults = await Promise.all(searchPromises);

        chunkResults.forEach(({ title, id }) => {
            if (id !== null) {
                titleToIdMap[title] = id;
            }
        });

        if (i < titleChunks.length - 1) {
            await new Promise(r => setTimeout(r, SEARCH_BATCH_DELAY_MS));
        }
    }

    return NextResponse.json({ titleToIdMap });

  } catch (err: any) {
    console.error(`[get-igdb-ids API Error] ${err.message}`);
    return NextResponse.json({ message: err.message || 'Internal server error' }, { status: 500 });
  }
}
