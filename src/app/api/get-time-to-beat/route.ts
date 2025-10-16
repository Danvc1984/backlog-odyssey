
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getIGDBAccessToken } from '@/lib/igdbAuth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get('title');

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ message: 'Missing or invalid game name' }, { status: 400 });
  }

  try {
    const token = await getIGDBAccessToken();
    const clientId = process.env.IGDB_CLIENT_ID;

    if (!clientId) {
      return NextResponse.json({ message: 'IGDB Client ID not configured.' }, { status: 500 });
    }

    // Step 1: Search for the game by name to get its ID
    const searchResponse = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      body: `search "${name.replace(/"/g, '\\"')}"; fields id; limit 1;`
    });

    if (!searchResponse.ok) {
        const errorBody = await searchResponse.text();
        console.error('IGDB game search failed:', errorBody);
        return NextResponse.json({ message: `IGDB game search failed. Status: ${searchResponse.status}`}, { status: searchResponse.status });
    }
    
    const games = await searchResponse.json();
    if (!games || games.length === 0) {
      return NextResponse.json({ playtimeNormally: null, playtimeCompletely: null }, { status: 404 });
    }
    const gameId = games[0].id;

    // Step 2: Query time-to-beat using the game ID
    const timeResponse = await fetch('https://api.igdb.com/v4/game_time_to_beats', {
        method: 'POST',
        headers: {
            'Client-ID': clientId,
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
        },
        body: `fields normally, completely; where game_id = ${gameId};`
    });

    if (!timeResponse.ok) {
        const errorBody = await timeResponse.text();
        console.error('IGDB game_time_to_beats search failed:', errorBody);
        return NextResponse.json({ message: `IGDB game_time_to_beats search failed. Status: ${timeResponse.status}`}, { status: timeResponse.status });
    }

    const timeData = await timeResponse.json();
    
    let playtimeNormally: number | null = null;
    let playtimeCompletely: number | null = null;

    if (timeData && timeData.length > 0) {
      if (timeData[0].normally) {
        playtimeNormally = Math.round(timeData[0].normally / 3600);
      }
      if (timeData[0].completely) {
        playtimeCompletely = Math.round(timeData[0].completely / 3600);
      }
    }

    return NextResponse.json({ playtimeNormally, playtimeCompletely });

  } catch (err: any) {
    console.error(`[IGDB API Error] ${err.message}`);
    return NextResponse.json({ message: err.message || 'Internal server error' }, { status: 500 });
  }
}
