
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-game-recommendations.ts';
import '@/ai/flows/generate-challenge-ideas.ts';
import '@/ai/flows/get-up-next-suggestions.ts';
import '@/ai/flows/generate-external-recommendation.ts';
