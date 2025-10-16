
// This is a server-side file.
'use server';

/**
 * @fileOverview Provides personalized game recommendations based on the user's game library, active challenges, and current mood.
 *
 * - generateGameRecommendations - A function that generates game recommendations.
 * - GenerateGameRecommendationsInput - The input type for the function.
 * - GenerateGameRecommendationsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GameSchema = z.object({
  id: z.string().describe('The unique ID of the game.'),
  title: z.string().describe('The title of the game.'),
  platform: z.string().describe('The platform the game is played on.'),
  genres: z.array(z.string()).describe('The genres of the game.'),
  list: z.enum(['Wishlist', 'Backlog', 'Now Playing', 'Recently Played']).describe('The list the game is in.'),
  rating: z.number().optional().describe("The user's personal rating for the game, from 1 to 5. If not provided, it should be considered a neutral 3/5."),
  playtimeNormally: z.number().optional().describe("The estimated time to beat the main story in hours."),
  playtimeCompletely: z.number().optional().describe("The estimated time to 100% complete the game in hours."),
  steamDeckCompat: z.string().optional().describe('The Steam Deck compatibility rating: unknown, unsupported, playable, verified.'),
  releaseDate: z.string().optional().describe("The game's release date in YYYY-MM-DD format."),
  dateAdded: z.string().optional().describe('The ISO 8601 date string for when the game was added to the library.'),
  dateCompleted: z.string().optional().describe('The ISO 8601 date string for when the game was completed.'),
  replayCount: z.number().optional().describe('How many times the user has replayed this game.'),
});

const ChallengeSchema = z.object({
    title: z.string().describe('The title of the challenge.'),
    description: z.string().describe('A brief description of the challenge.'),
    goal: z.number().describe('The number of games to complete for this challenge.'),
    progress: z.number().describe('The current progress of the challenge.'),
});

const GenerateGameRecommendationsInputSchema = z.object({
  gameLibrary: z.array(GameSchema).describe("The user's entire game library."),
  activeChallenges: z.array(ChallengeSchema).optional().describe("The user's active challenges."),
  gamingHabits: z.string().optional().describe("A description of the user's current gaming mood or preferences. If it's empty or a generic request like 'Just suggest something good', rely more heavily on other factors."),
  userPreferences: z.object({
    platforms: z.array(z.string()).describe('The platforms the user owns.'),
    trackCompletionistPlaytime: z.boolean().describe('Whether the user tracks 100% completionist playtime.'),
    playsOnSteamDeck: z.boolean().describe('Whether the user plays on a Steam Deck.')
  }).describe("The user's general gaming preferences.")
});
export type GenerateGameRecommendationsInput = z.infer<
  typeof GenerateGameRecommendationsInputSchema
>;

const SuggestionSchema = z.object({
  gameId: z.string().describe("The unique ID of the suggested game from the user's library."),
  reason: z.string().describe('A short, compelling, and personalized reason why this specific game is being recommended based on the user\'s mood and library. Max 1-2 sentences.'),
});

const GenerateGameRecommendationsOutputSchema = z.object({
  recommendations: z
    .array(SuggestionSchema)
    .max(3)
    .describe('A ranked list of 3 game suggestions for the user to play.'),
});
export type GenerateGameRecommendationsOutput = z.infer<
  typeof GenerateGameRecommendationsOutputSchema
>;

export async function generateGameRecommendations(
  input: GenerateGameRecommendationsInput
): Promise<GenerateGameRecommendationsOutput> {
  return generateGameRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateGameRecommendationsPrompt',
  input: {schema: GenerateGameRecommendationsInputSchema},
  output: {schema: GenerateGameRecommendationsOutputSchema},
  prompt: `You are an expert gaming curator. The user wants recommendations based on their current mood. Your task is to analyze their game library and stated preferences to suggest 3 games for them to play.

**CRITICAL SELECTION CRITERIA:**
1.  **User's Mood is Paramount:** The 'gamingHabits' input is a primary factor. If it is specific, the recommendations MUST align with it (e.g., if they want a short action game, don't suggest a long RPG). If it's empty or a generic request, rely more on the other criteria.
2.  **Platform Priority:** Only suggest games on platforms the user owns.
3.  **Prioritize Backlog & Wishlist:** The best recommendations come from games the user already owns but hasn't played. Unlike other features, you should be more liberal with 'Wishlist' games; they are fair game even without a high rating if they match the user's mood.
4.  **Consider Active Challenges:** If the user has active challenges, suggest games that would help them make progress. For example, if a challenge is "Beat 3 RPGs", and the user is in the mood for an RPG, suggesting a backlog RPG is a perfect recommendation. Mention this in your reason.
5.  **Steam Deck Awareness:** If the user plays on a Steam Deck, and their mood suggests portable play (e.g., "on the go", "traveling"), prioritize games with 'verified' or 'playable' compatibility.

**RANKING & REASONING FACTORS:**
-   **Play History & Favorites:** A high 'replayCount' is a very strong signal of a favorite game, even if there is no completion date; suggest similar titles. A high rating is also a strong signal. Low ratings suggest what to avoid. Assume unrated games are a neutral 3/5. Use 'dateCompleted' to avoid suggesting a game they *just* finished.
-   **Backlog Age:** Use 'dateAdded' to identify games that have been in the backlog for a long time. These "hidden gems" can be great suggestions.
-   **Release Date:** Consider the release date. You could suggest a "blast from the past" or a "brand new adventure".
-   **Playtime:** Use 'playtimeNormally' for standard suggestions. If the user wants something "long" or to "100% a game", and they track completionist playtime, use 'playtimeCompletely' to find a good match.
-   **Variety:** The final list of 3 should ideally offer some variety unless the user asks for something very specific.

**OUTPUT:**
-   Return a ranked list of exactly 3 suggestions.
-   For each suggestion, provide a concise, personalized 'reason' that explains *why* it's a great choice for them *right now*, directly referencing their mood and other factors.
-   Ensure the 'gameId' for each suggestion correctly matches the ID from the input library.

**USER DATA:**

**User's Current Mood:**
"{{#if gamingHabits}}{{gamingHabits}}{{else}}Just suggest something good for me to play.{{/if}}"

**User's Preferences:**
- Owned Platforms: {{#each userPreferences.platforms}}{{.}}{{#unless @last}}, {{/unless}}{{/each}}
- Tracks Completionist Playtime: {{userPreferences.trackCompletionistPlaytime}}
- Plays on Steam Deck: {{userPreferences.playsOnSteamDeck}}

**Active Challenges:**
{{#if activeChallenges}}
  {{#each activeChallenges}}
  - {{title}}: {{description}} (Progress: {{progress}}/{{goal}})
  {{/each}}
{{else}}
  None
{{/if}}

**Game Library:**
{{#each gameLibrary}}
- id: {{id}}, title: "{{title}}", list: "{{list}}", platform: "{{platform}}", genres: [{{#each genres}}"{{.}}"{{#unless @last}}, {{/unless}}{{/each}}]{{#if rating}}, rating: {{rating}}/5{{/if}}{{#if replayCount}}, replays: {{replayCount}}{{/if}}{{#if playtimeNormally}}, playtime: {{playtimeNormally}}h{{/if}}{{#if steamDeckCompat}}, deck: {{steamDeckCompat}}{{/if}}{{#if dateAdded}}, added: {{dateAdded}}{{/if}}
{{/each}}
`,
});

const generateGameRecommendationsFlow = ai.defineFlow(
  {
    name: 'generateGameRecommendationsFlow',
    inputSchema: GenerateGameRecommendationsInputSchema,
    outputSchema: GenerateGameRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
