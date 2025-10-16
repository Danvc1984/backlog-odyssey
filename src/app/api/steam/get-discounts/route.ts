'use server';

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: NextRequest) {
  try {
    const { appIds } = await req.json();

    if (!appIds || !Array.isArray(appIds) || appIds.length === 0) {
      return NextResponse.json({ message: 'App IDs are required.' }, { status: 400 });
    }

    // Steam API takes a comma-separated string of app IDs
    const appIdsString = appIds.join(',');

    const response = await axios.get(`https://store.steampowered.com/api/appdetails`, {
      params: {
        appids: appIdsString,
        cc: 'us', // Assuming US region, can be parameterized later
        filters: 'price_overview',
      },
    });

    const deals: Record<string, any> = {};
    const data = response.data;

    for (const appId in data) {
      if (data[appId].success && data[appId].data?.price_overview) {
        const priceOverview = data[appId].data.price_overview;
        if (priceOverview.discount_percent > 0) {
          deals[appId] = {
            discountPercent: priceOverview.discount_percent,
            finalFormatted: priceOverview.final_formatted,
          };
        }
      }
    }

    return NextResponse.json({ deals });
  } catch (error: any) {
    console.error('Error fetching from Steam API:', error);
    return NextResponse.json(
      { message: 'Failed to fetch deals from Steam.', error: error.message },
      { status: 500 }
    );
  }
}
