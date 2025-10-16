
'use server';

/**
 * @fileOverview Provides personalized "Up Next" game suggestions based on a user's library and preferences.
 * 
 * - getUpNextSuggestions - A function that generates a ranked list of games to play next.
 * - GetUpNextSuggestionsInput - The input type for the function.
 * - GetUpNextSuggestionsOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GameSchema = z.object({
  id: z.string().describe('The unique ID of the game.'),
  title: z.string().describe('The title of the game.'),
  platform: z.string().describe('The platform the game is played on.'),
  genres: z.array(z.string()).describe('The genres of the game.'),
  list: z
    .enum(['Wishlist', 'Backlog', 'Now Playing', 'Recently Played'])
    .describe('The list the game is in.'),
  rating: z
    .number()
    .optional()
    .describe("The user's personal rating for the game, from 1 to 5. If not provided, it should be considered a neutral 3/5."),
  playtimeNormally: z.number().optional().describe("The estimated time to beat the main story in hours."),
  playtimeCompletely: z.number().optional().describe("The estimated time to 100% complete the game in hours."),
  steamDeckCompat: z.string().optional().describe('The Steam Deck compatibility rating: unknown, unsupported, playable, verified.'),
  releaseDate: z.string().optional().describe("The game's release date in YYYY-MM-DD format."),
  dateAdded: z.string().optional().describe('The ISO 8601 date string for when the game was added to the library.'),
  dateCompleted: z.string().optional().describe('The ISO 8601 date string for when the game was completed.'),
  replayCount: z.number().optional().describe('How many times the user has replayed this game.'),
});

const GetUpNextSuggestionsInputSchema = z.object({
  gameLibrary: z.array(GameSchema).describe("The user's entire game library."),
  userPreferences: z.object({
    playsOnSteamDeck: z.boolean().describe('Whether the user plays on a Steam Deck.'),
    trackCompletionistPlaytime: z.boolean().describe('Whether the user tracks completionist playtime.'),
  }).describe("The user's general gaming preferences.")
});
export type GetUpNextSuggestionsInput = z.infer<
  typeof GetUpNextSuggestionsInputSchema
>;

const SuggestionSchema = z.object({
  gameId: z.string().describe("The unique ID of the suggested game from the user's library."),
  reason: z.string().describe('A short, compelling, and personalized reason why this specific game is being recommended for the user to play next. Max 1-2 sentences.'),
});

const GetUpNextSuggestionsOutputSchema = z.object({
  suggestions: z
    .array(SuggestionSchema)
    .max(5)
    .describe('A ranked list of 5 game suggestions for the user to play next.'),
});
export type GetUpNextSuggestionsOutput = z.infer<
  typeof GetUpNextSuggestionsOutputSchema
>;

export async function getUpNextSuggestions(
  input: GetUpNextSuggestionsInput
): Promise<GetUpNextSuggestionsOutput> {
  return getUpNextSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getUpNextSuggestionsPrompt',
  input: { schema: GetUpNextSuggestionsInputSchema },
  output: { schema: GetUpNextSuggestionsOutputSchema },
  prompt: `You are an expert gaming curator. Your task is to analyze a user's game library to create a compelling, ranked "Up Next" queue of 5 games for them to play. This is for a general-purpose queue, not based on a specific mood.

You must prioritize games from the 'Backlog' and 'Wishlist' lists.

**CRITICAL SELECTION CRITERIA:**
1.  **Backlog Games:** These are top candidates. Prioritize them based on genre match, playtime, and user ratings.
2.  **Wishlist Games:** Only suggest these if they have an explicit user rating of 4 or 5.
3.  **Steam Deck Awareness:** If the user plays on a Steam Deck, try to include a few games that are 'verified' or 'playable' for on-the-go gaming.

**RANKING & REASONING FACTORS:**
-   **User Ratings and Replays:** These are the strongest signals. A rating of 5 OR a high \`replayCount\` is a huge indicator of taste. A replay count is significant even without a completion date. A rating of 1 or 2 means you should avoid similar games. If a game has no rating, assume a neutral interest level of 3/5.
-   **Play History:** Analyze 'Now Playing' and 'Recently Played' games. Use 'dateCompleted' to avoid suggesting a game they just finished.
-   **Backlog Age:** Use 'dateAdded' to find games that have been sitting in the backlog for a long time. Frame these as "hidden gems" or suggest it's "finally time to play this classic."
-   **Release Date:** Suggest a mix of newer titles and older classics.
-   **Playtime:** Consider suggesting shorter games from the backlog to help the user feel a sense of accomplishment. Mentioning this in the reason is a good idea (e.g., "A perfect short adventure to clear from your backlog."). If the user tracks completionist playtime, you can refer to 'playtimeCompletely'.
-   **Genre & Platform:** Look for patterns. If they play a lot of RPGs on PC, that's a strong signal.
-   **Variety:** The final list of 5 should be varied. Don't suggest five 100-hour RPGs. Mix it up with different genres, platforms, and playtimes.

**OUTPUT:**
-   Return a ranked list of exactly 5 suggestions.
-   For each suggestion, provide a concise, personalized 'reason' that explains *why* it's a great choice for them *right now*, referencing the factors above.
-   Ensure the 'gameId' for each suggestion correctly matches the ID from the input library.

**USER DATA:**

**User's Preferences:**
- Plays on Steam Deck: {{userPreferences.playsOnSteamDeck}}
- Tracks Completionist Playtime: {{userPreferences.trackCompletionistPlaytime}}

**Game Library:**
{{#each gameLibrary}}
- id: {{id}}, title: "{{title}}", list: "{{list}}", platform: "{{platform}}", genres: [{{#each genres}}"{{.}}"{{#unless @last}}, {{/unless}}{{/each}}]{{#if rating}}, rating: {{rating}}/5{{/if}}{{#if replayCount}}, replays: {{replayCount}}{{/if}}{{#if playtimeNormally}}, playtime: {{playtimeNormally}}h{{/if}}{{#if steamDeckCompat}}, deck: {{steamDeckCompat}}{{/if}}{{#if dateAdded}}, added: {{dateAdded}}{{/if}}
{{/each}}
`,
});


const getUpNextSuggestionsFlow = ai.defineFlow(
  {
    name: 'getUpNextSuggestionsFlow',
    inputSchema: GetUpNextSuggestionsInputSchema,
    outputSchema: GetUpNextSuggestionsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
