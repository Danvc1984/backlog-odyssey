'use server';

import axios from 'axios';

export type SteamDeckCompat =
  | 'native'
  | 'platinum'
  | 'gold'
  | 'silver'
  | 'bronze'
  | 'borked'
  | 'unknown';

export async function getSteamDeckCompat(
  appId: number
): Promise<SteamDeckCompat> {
  try {
    const response = await axios.get(
      `https://www.protondb.com/api/v1/reports/summaries/${appId}.json`
    );
    const tier = response.data?.tier;
    if (['native', 'platinum', 'gold', 'silver', 'bronze', 'borked'].includes(tier)) {
      return tier;
    }
    return 'unknown';
  } catch (error) {
    return 'unknown';
  }
}
