
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getIGDBAccessToken } from '@/lib/igdbAuth';
import { IGDBGame } from '@/lib/igdb';

/**
 * Helper to split array into chunks
 */
function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

const SEARCH_BATCH_SIZE = 4; // IGDB recommends 4 req/sec, so process 4 searches concurrently
const SEARCH_BATCH_DELAY_MS = 1000; // 1 second delay between batches of searches
const TTB_MULTIQUERY_BATCH_SIZE = 10; // IGDB allows max 10 queries per multiquery
const TTB_MULTIQUERY_DELAY_MS = 1000; // Delay between TTB multiquery batches

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
    const MULTIQUERY_URL = 'https://api.igdb.com/v4/multiquery';

    const nameToId: Record<string, number> = {};
    const gameIdsToFetchTTB: number[] = [];

    const titleChunks = chunkArray(titles, SEARCH_BATCH_SIZE);

    // First, search for each game by title in concurrent batches to get their IGDB IDs
    for (let i = 0; i < titleChunks.length; i++) {
      const chunk = titleChunks[i];
      const searchPromises = chunk.map(async (title) => {
        // Corrected escaping for double quotes within the title
        const searchBody = `search "${title.replace(/"/g, '\\"')}"; fields id, name; limit 1;`;
        
        try {
          const searchResponse = await fetch(IGDB_SEARCH_URL, {
            method: 'POST',
            headers: IGDB_HEADERS,
            body: searchBody,
          });

          if (!searchResponse.ok) {
            console.warn(`IGDB search for "${title}" failed with status ${searchResponse.status}:`, await searchResponse.text());
            return { title, id: null };
          }

          const searchResult: IGDBGame[] = await searchResponse.json();
          if (searchResult.length > 0) {
            return { title, id: searchResult[0].id };
          } else {
            console.warn(`No IGDB ID found for title: "${title}"`);
            return { title, id: null };
          }
        } catch (error: any) {
          console.error(`Error fetching IGDB ID for "${title}":`, error.message);
          return { title, id: null };
        }
      });

      const chunkResults = await Promise.all(searchPromises);

      chunkResults.forEach(({ title, id }) => {
        if (id !== null) {
          nameToId[title] = id;
          gameIdsToFetchTTB.push(id);
        }
      });

      // Add a delay between batches to respect IGDB's rate limits
      if (i < titleChunks.length - 1) {
        await new Promise((r) => setTimeout(r, SEARCH_BATCH_DELAY_MS));
      }
    }

    console.log('Extracted Game IDs (with titles):', JSON.stringify(nameToId, null, 2));

    if (gameIdsToFetchTTB.length === 0) {
      return NextResponse.json({ playtimes: {} });
    }

    const allTtbResults: any[] = [];
    const ttbIdChunks = chunkArray(gameIdsToFetchTTB, TTB_MULTIQUERY_BATCH_SIZE);

    for (let i = 0; i < ttbIdChunks.length; i++) {
      const idChunk = ttbIdChunks[i];
      const ttbQuery = idChunk.map((id) => `
        query game_time_to_beats "ttb_${id}" {
          fields normally, completely;
          where game_id = ${id};
        };
      `).join('\n'); 

      const ttbResponse = await fetch(MULTIQUERY_URL, {
          method: 'POST',
          headers: IGDB_HEADERS,
          body: ttbQuery
      });

      if (!ttbResponse.ok) {
          const errorBody = await ttbResponse.text();
          console.error('IGDB multiquery for ttb failed:', errorBody);
          // Decide whether to throw or continue. For robust batch processing, we might continue
          // and just not have playtime for this batch, or retry. For now, we'll rethrow to indicate a problem.
          throw new Error(`IGDB multiquery for ttb failed. Status: ${ttbResponse.status}. Body: ${errorBody}`);
      }

      const chunkTtbResults = await ttbResponse.json();
      allTtbResults.push(...chunkTtbResults);

      // Add a delay between TTB multiquery batches
      if (i < ttbIdChunks.length - 1) {
        await new Promise((r) => setTimeout(r, TTB_MULTIQUERY_DELAY_MS));
      }
    }

    const playtimes: Record<string, { playtimeNormally: number | null, playtimeCompletely: number | null }> = {};

    titles.forEach((title) => {
      const id = nameToId[title];
      if (id) {
        const ttbResult = allTtbResults.find((r: any) => r.name === `ttb_${id}`);
        if (ttbResult && ttbResult.result.length > 0) {
          const timeData = ttbResult.result[0];
          playtimes[title] = {
              playtimeNormally: timeData.normally ? Math.round(timeData.normally / 3600) : null,
              playtimeCompletely: timeData.completely ? Math.round(timeData.completely / 3600) : null,
          };
        } else {
          playtimes[title] = { playtimeNormally: null, playtimeCompletely: null };
        }
      } else {
         playtimes[title] = { playtimeNormally: null, playtimeCompletely: null };
      }
    });

    return NextResponse.json({ playtimes });

  } catch (err: any) {
    console.error(`[IGDB Batch Time to Beat API Error] ${err.message}`);
    return NextResponse.json({ message: err.message || 'Internal server error' }, { status: 500 });
  }
}
