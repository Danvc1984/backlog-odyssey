
'use server';

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const RAWG_API_KEY = process.env.NEXT_PUBLIC_RAWG_API_KEY;

// Helper to split array into chunks
function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

const SEARCH_BATCH_SIZE = 10;
const SEARCH_BATCH_DELAY_MS = 1000; // 1 second delay between batches

export async function POST(req: NextRequest) {
    const { titles } = await req.json();

    if (!titles || !Array.isArray(titles) || titles.length === 0) {
        return NextResponse.json({ message: 'Game titles are required.' }, { status: 400 });
    }
    if (!RAWG_API_KEY) {
        return NextResponse.json({ message: 'RAWG API Key is not configured on the server.' }, { status: 500 });
    }

    const details: Record<string, any> = {};
    const titleChunks = chunkArray(titles, SEARCH_BATCH_SIZE);

    for (let i = 0; i < titleChunks.length; i++) {
        const chunk = titleChunks[i];
        
        const searchPromises = chunk.map(async (title) => {
            try {
                const response = await axios.get('https://api.rawg.io/api/games', {
                    params: { key: RAWG_API_KEY, search: title, page_size: 1 },
                });
                if (response.data.results.length > 0) {
                    const exactMatch = response.data.results.find((g: any) => g.name.toLowerCase() === title.toLowerCase());
                    return { title, detail: exactMatch || response.data.results[0] };
                }
                return { title, detail: null };
            } catch (error: any) {
                 if (axios.isAxiosError(error) && error.response) {
                    if (error.response.status === 401) {
                        throw new Error('Invalid RAWG API Key.');
                    }
                 }
                console.error(`Error fetching RAWG details for "${title}":`, error.message);
                return { title, detail: null };
            }
        });

        const chunkResults = await Promise.all(searchPromises);
        
        for (const { title, detail } of chunkResults) {
            if (detail) {
                details[title] = detail;
            }
        }

        if (i < titleChunks.length - 1) {
            await new Promise(r => setTimeout(r, SEARCH_BATCH_DELAY_MS));
        }
    }

    return NextResponse.json({ details });
}
