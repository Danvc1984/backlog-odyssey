
'use server';

/**
 * @fileOverview Provides creative and trackable challenge ideas based on the user's game library.
 *
 * - generateChallengeIdeas - A function that generates challenge ideas.
 * - GenerateChallengeIdeasInput - The input type for the function.
 * - GenerateChallengeIdeasOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GameSchema = z.object({
  title: z.string().describe('The title of the game.'),
  platform: z.string().describe('The platform the game is played on.'),
  genres: z.array(z.string()).describe('The genres of the game.'),
  list: z
    .enum(['Wishlist', 'Backlog', 'Now Playing', 'Recently Played'])
    .describe('The list the game is in.'),
  releaseDate: z.string().optional().describe("The game's release date in YYYY-MM-DD format."),
  dateAdded: z.string().optional().describe('The ISO 8601 date string for when the game was added to the library.'),
  dateCompleted: z.string().optional().describe('The ISO 8601 date string for when the game was completed.'),
  replayCount: z.number().optional().describe('How many times the user has replayed this game.'),
});

const GenerateChallengeIdeasInputSchema = z.object({
  gameLibrary: z.array(GameSchema).describe("The user's game library."),
});
export type GenerateChallengeIdeasInput = z.infer<
  typeof GenerateChallengeIdeasInputSchema
>;

const ChallengeIdeaSchema = z.object({
    title: z.string().describe('A short, catchy title for the challenge. e.g., "RPG Backlog Blitz"'),
    description: z.string().describe('A brief, one-sentence description of the challenge. e.g., "Conquer 3 unplayed RPGs from your daunting backlog."'),
    goal: z.number().describe('The number of games to complete for this challenge.')
});

const GenerateChallengeIdeasOutputSchema = z.object({
  ideas: z
    .array(ChallengeIdeaSchema)
    .describe('A list of 3-5 creative and trackable challenge ideas.'),
});
export type GenerateChallengeIdeasOutput = z.infer<
  typeof GenerateChallengeIdeasOutputSchema
>;

export async function generateChallengeIdeas(
  input: GenerateChallengeIdeasInput
): Promise<GenerateChallengeIdeasOutput> {
  return generateChallengeIdeasFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateChallengeIdeasPrompt',
  input: {schema: GenerateChallengeIdeasInputSchema},
  output: {schema: GenerateChallengeIdeasOutputSchema},
  prompt: `You are an expert in gaming culture and personal goal setting. Analyze the user's game library to generate creative, fun, and ACHIEVABLE challenge ideas.

IMPORTANT: The challenges must be trackable by simply counting how many games are moved to a "completed" list. DO NOT suggest challenges that require external information like "achievements", "endings", "no-kill runs", or any specific in-game objectives. The ideas must be short, punchy, and sound like a real gaming challenge.

Consider the following when generating ideas:
- **Replay Value is a Key Signal:** A game with a 'replayCount > 0' is a clear favorite, even if it has no completion date. Suggest challenges that involve replaying a favorite alongside beating a new game in the same genre.
- Create a mix of difficulties. Some simple (e.g., "Beat 1 game from your backlog"), some more complex (e.g., "Beat an RPG and an Action game").
- The goal for each challenge should be a number between 1 and 5.
- Combine genres or platforms (e.g., "The Platform Hopper: Beat one PC game and one PlayStation game").
- **Backlog Archeology:** Use 'dateAdded' to find games that have been in the backlog for a long time. Frame this as "dusting off a classic" or "conquering an old foe."
- **Recent Additions:** Suggest a challenge to tackle a game that was recently added to the backlog.
- **The Finisher:** Look at games on the 'Now Playing' list and suggest a goal to complete one of them.
- **Time Traveler:** Use 'releaseDate' to create challenges like "The Retro Run" (beat a game released before 2010) or "Modern Marvel" (beat a game from the last two years).

Game Library:
{{#each gameLibrary}}
- Title: {{title}}
  Platform: {{platform}}
  Genres: {{#each genres}}{{.}}{{#unless @last}}, {{/unless}}{{/each}}
  List: {{list}}
  {{#if replayCount}}Replays: {{replayCount}}{{/if}}
  {{#if releaseDate}}Released: {{releaseDate}}{{/if}}
  {{#if dateAdded}}Added: {{dateAdded}}{{/if}}
  {{#if dateCompleted}}Completed: {{dateCompleted}}{{/if}}
{{/each}}

Based on this library, generate a list of 3 to 5 distinct and compelling challenge ideas, each with a title, description, and a numerical goal.
`,
});

const generateChallengeIdeasFlow = ai.defineFlow(
  {
    name: 'generateChallengeIdeasFlow',
    inputSchema: GenerateChallengeIdeasInputSchema,
    outputSchema: GenerateChallengeIdeasOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
