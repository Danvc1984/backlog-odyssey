
export interface IGDBGame {
  id: number;
  name: string;
  genres?: number[];
  release_dates?: number[];
  // add other fields you need
}

const IGDB_URL = "https://api.igdb.com/v4/games";
const RATE_LIMIT = 4; // IGDB: 4 requests per second
const BATCH_SIZE = 50; // how many IDs to query per request

/**
 * Wait for a specific duration
 */
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

/**
 * Split an array into smaller chunks
 */
const chunk = <T>(arr: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

/**
 * Fetch a batch of games by IDs from IGDB
 */
async function fetchBatch(ids: number[], fields = "id,name,genres,release_dates"): Promise<IGDBGame[]> {
  const body = `fields ${fields}; where id = (${ids.join(",")});`;
  
  const res = await fetch(IGDB_URL, {
    method: "POST",
    headers: {
      "Client-ID": process.env.IGDB_CLIENT_ID!,
      "Authorization": `Bearer ${process.env.IGDB_ACCESS_TOKEN!}`,
      "Accept": "application/json"
    },
    body
  });

  if (res.status === 429) {
    // IGDB rate-limited you — wait and retry
    const retryAfter = parseInt(res.headers.get("Retry-After") || "1", 10);
    console.warn(`Rate limit hit. Retrying after ${retryAfter}s...`);
    await delay(retryAfter * 1000);
    return fetchBatch(ids, fields);
  }

  if (!res.ok) {
    console.error("IGDB error:", res.status, await res.text());
    throw new Error(`IGDB request failed: ${res.status}`);
  }

  return res.json();
}

/**
 * Fetch multiple games by their IDs (batched + throttled)
 */
export async function fetchGamesByIds(ids: number[]): Promise<IGDBGame[]> {
  const idBatches = chunk(ids, BATCH_SIZE);
  const allResults: IGDBGame[] = [];

  for (let i = 0; i < idBatches.length; i++) {
    const batch = idBatches[i];
    const batchResult = await fetchBatch(batch);
    allResults.push(...batchResult);

    // throttle requests: 4 req/sec = 250ms delay between each batch
    if (i < idBatches.length - 1) {
      await delay(250);
    }
  }

  return allResults;
}
