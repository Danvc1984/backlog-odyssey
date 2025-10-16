
'use server';

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const RAWG_API_KEY = process.env.NEXT_PUBLIC_RAWG_API_KEY;

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get('title');

    if (!title) {
        return NextResponse.json({ message: 'Game title is required.' }, { status: 400 });
    }
     if (!RAWG_API_KEY) {
        return NextResponse.json({ message: 'RAWG API Key is not configured on the server.' }, { status: 500 });
    }

    try {
        const response = await axios.get('https://api.rawg.io/api/games', {
            params: { key: RAWG_API_KEY, search: title, page_size: 1 },
        });

        if (response.data.results.length > 0) {
            const game = response.data.results[0];
            return NextResponse.json({ game });
        } else {
            return NextResponse.json({ message: 'Game not found.' }, { status: 404 });
        }
    } catch (error: any) {
        console.error(`Error fetching RAWG details for "${title}":`, error.message);
        return NextResponse.json({ message: 'Failed to fetch game details from RAWG.' }, { status: 500 });
    }
}
