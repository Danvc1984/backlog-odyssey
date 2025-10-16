
'use server';

/**
 * @fileOverview Provides a single, external game recommendation based on the user's library and preferences.
 * 
 * - generateExternalRecommendation - A function that generates a recommendation for a game not in the user's library.
 * - GenerateExternalRecommendationInput - The input type for the function.
 * - GenerateExternalRecommendationOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GameSchema = z.object({
  id: z.string().describe('The unique ID of the game.'),
  title: z.string().describe('The title of the game.'),
  platform: z.string().describe('The platform the game is played on.'),
  genres: z.array(z.string()).describe('The genres of the game.'),
  list: z.enum(['Wishlist', 'Backlog', 'Now Playing', 'Recently Played']).describe('The list the game is in.'),
  rating: z.number().optional().describe("The user's personal rating for the game, from 1 to 5."),
  playtimeNormally: z.number().optional().describe("The estimated time to beat the main story in hours."),
  playtimeCompletely: z.number().optional().describe("The estimated time to 100% complete the game in hours."),
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

const GenerateExternalRecommendationInputSchema = z.object({
  gameLibrary: z.array(GameSchema).describe("The user's entire game library."),
  activeChallenges: z.array(ChallengeSchema).optional().describe("The user's active challenges."),
  userPreferences: z.object({
    platforms: z.array(z.string()).describe('The platforms the user owns.'),
    trackCompletionistPlaytime: z.boolean().describe('Whether the user tracks 100% completionist playtime.'),
  }).describe("The user's general gaming preferences.")
});
export type GenerateExternalRecommendationInput = z.infer<typeof GenerateExternalRecommendationInputSchema>;

const GenerateExternalRecommendationOutputSchema = z.object({
    title: z.string().describe("The title of the recommended game."),
    reason: z.string().describe("A compelling, personalized reason explaining why the user would enjoy this game. Explain how it relates to games they've liked, but also why it's a fresh experience. (2-3 sentences)."),
    genres: z.array(z.string()).describe("A list of the recommended game's main genres.")
});
export type GenerateExternalRecommendationOutput = z.infer<typeof GenerateExternalRecommendationOutputSchema>;

export async function generateExternalRecommendation(
  input: GenerateExternalRecommendationInput
): Promise<GenerateExternalRecommendationOutput> {
  return generateExternalRecommendationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateExternalRecommendationPrompt',
  input: { schema: GenerateExternalRecommendationInputSchema },
  output: { schema: GenerateExternalRecommendationOutputSchema },
  prompt: `You are an expert gaming curator tasked with finding a hidden gem for a user. Your goal is to recommend ONE single game that is NOT in their existing library.

**CRITICAL INSTRUCTIONS:**
1.  **MUST NOT BE IN LIBRARY:** The recommended game's title must NOT be present in the user's game library list provided below. This is the most important rule.
2.  **CONSIDER USER PREFERENCES:** The game must be available on one of the user's owned platforms.
3.  **ANALYZE GAMING TASTE:**
    *   **High Ratings & Replays are Key:** Games with a high rating (4-5) or a \`replayCount\` greater than 0 are VERY strong indicators of the user's taste. A high replay count is significant even without a completion date. Find a game that shares genres or themes with these favorites but offers a new twist.
    *   **Low Ratings:** Avoid genres or types of games that the user has consistently rated poorly (1-2).
    *   **Play History:** Look at 'Recently Played' and 'Now Playing' to understand their current interests.
    *   **Challenges:** Consider their active challenges. If they are working on a 'Beat 3 RPGs' challenge, a highly-rated RPG they don't own would be a great suggestion.
    *   **Playtime:** If they tend to play shorter games, don't recommend a 100-hour epic unless their favorite games are also very long.
4.  **PROVIDE A FRESH EXPERIENCE:** Don't just suggest the next game in a series they've already played (e.g., if they have 'The Witcher 3', don't just suggest 'The Witcher 2'). Find something new that aligns with their demonstrated tastes. Think of an indie title that matches the vibe of a AAA favorite, or a game from a genre they like but with a unique mechanic.

**USER DATA:**

**User's Preferences:**
- Owned Platforms: {{#each userPreferences.platforms}}{{.}}{{#unless @last}}, {{/unless}}{{/each}}
- Tracks Completionist Playtime: {{userPreferences.trackCompletionistPlaytime}}

**Active Challenges:**
{{#if activeChallenges}}
  {{#each activeChallenges}}
  - {{title}}: {{description}} (Progress: {{progress}}/{{goal}})
  {{/each}}
{{else}}
  None
{{/if}}

**Game Library (DO NOT RECOMMEND ANY OF THESE):**
{{#each gameLibrary}}
- Title: "{{title}}", List: "{{list}}"{{#if rating}}, Rating: {{rating}}/5{{/if}}{{#if replayCount}}, Replays: {{replayCount}}{{/if}}
{{/each}}

Based on all this data, provide a single, compelling game recommendation.
`,
});

const generateExternalRecommendationFlow = ai.defineFlow(
  {
    name: 'generateExternalRecommendationFlow',
    inputSchema: GenerateExternalRecommendationInputSchema,
    outputSchema: GenerateExternalRecommendationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
