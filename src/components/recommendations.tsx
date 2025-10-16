
'use client';

import { useState } from 'react';
import { Loader2, Sparkles, RefreshCw, PlayCircle } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogBody,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { Game, GameList, Challenge } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { generateGameRecommendations, GenerateGameRecommendationsOutput } from '@/ai/flows/generate-game-recommendations';
import { useGameLibrary } from '@/hooks/use-game-library';
import { useUserPreferences } from '@/hooks/use-user-preferences';

type RecommendationsProps = {
  allGames: Game[];
  activeChallenges: Challenge[];
};

type Suggestion = GenerateGameRecommendationsOutput['recommendations'][0] & { gameDetails?: Game };

const safeToISOString = (date: any): string | undefined => {
  if (date && typeof date.toDate === 'function') {
    return date.toDate().toISOString();
  }
  if (typeof date === 'string') {
    return date;
  }
  return undefined;
};


const Recommendations: React.FC<RecommendationsProps> = ({ allGames, activeChallenges }) => {
  const [gamingHabits, setGamingHabits] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const { handleMoveGame } = useGameLibrary();
  const { preferences } = useUserPreferences();


  const handleGetRecommendations = async () => {
    if (!preferences) {
        toast({
            title: 'Preferences not loaded',
            description: 'User preferences are not loaded yet. Please try again in a moment.',
            variant: 'destructive',
        });
        return;
    }
    setIsLoading(true);
    setSuggestions([]);
    try {
      const result = await generateGameRecommendations({
        gameLibrary: allGames.map(g => ({
          id: g.id,
          title: g.title,
          platform: g.platform,
          genres: g.genres,
          list: g.list,
          rating: g.rating,
          playtimeNormally: g.playtimeNormally,
          playtimeCompletely: g.playtimeCompletely,
          ...(g.steamDeckCompat && { steamDeckCompat: g.steamDeckCompat }),
          releaseDate: safeToISOString(g.releaseDate),
          dateAdded: safeToISOString(g.dateAdded),
          dateCompleted: safeToISOString(g.dateCompleted),
          replayCount: g.replayCount,
        })),
        activeChallenges: activeChallenges.map(c => ({
          title: c.title,
          description: c.description,
          goal: c.goal,
          progress: c.progress
        })),
        gamingHabits: gamingHabits, // Can be an empty string
        userPreferences: {
            platforms: preferences.platforms,
            trackCompletionistPlaytime: !!preferences.trackCompletionistPlaytime,
            playsOnSteamDeck: !!preferences.playsOnSteamDeck,
        }
      });
      
      const populatedSuggestions = result.recommendations.map(rec => {
        const gameDetails = allGames.find(g => g.id === rec.gameId);
        return { ...rec, gameDetails };
      }).filter(s => s.gameDetails);

      setSuggestions(populatedSuggestions as Suggestion[]);

    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Failed to get recommendations. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoveAndClose = (game: Game, list: GameList) => {
    handleMoveGame(game, list);
    setIsOpen(false);
    setSuggestions([]);
    setGamingHabits('');
  }
  
  const handleDialogOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset state when closing
      setSuggestions([]);
      setGamingHabits('');
      setIsLoading(false);
    }
  }

  const hasSuggestions = suggestions.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger asChild>
        <Button className="animate-subtle-glow">
          <span className="hidden sm:inline">Get Recommendations</span>
          <Sparkles className="sm:hidden" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Game Recommendations</DialogTitle>
          <DialogDescription>
            {hasSuggestions
              ? "Here are some games tailored to your mood. Want different results?"
              : "Describe your current gaming mood for tailored suggestions, or leave it blank for general recommendations."}
          </DialogDescription>
        </DialogHeader>
        
        <DialogBody>
            <div className="space-y-4">
            <Textarea
                placeholder="e.g., 'I want a relaxing game I can play in short bursts.' or 'Looking for a deep RPG to 100% complete.'"
                value={gamingHabits}
                onChange={(e) => setGamingHabits(e.target.value)}
                className="min-h-[100px]"
                disabled={isLoading}
            />

            <div className="mt-6">
                {isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                        <div className="h-40 bg-muted rounded-t-lg"></div>
                        <CardContent className="p-4 space-y-3">
                        <div className="h-4 w-full bg-muted rounded"></div>
                        <div className="h-4 w-5/6 bg-muted rounded"></div>
                        <div className="h-10 w-full bg-muted rounded mt-4"></div>
                        </CardContent>
                    </Card>
                    ))}
                </div>
                )}
                {hasSuggestions && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {suggestions.map((rec) => {
                    if (!rec.gameDetails) return null;
                    const game = rec.gameDetails;
                    return (
                        <Card key={rec.gameId} className="bg-card/50 overflow-hidden flex flex-col group transition-transform duration-300 ease-in-out hover:scale-105 hover:shadow-lg hover:shadow-primary/20">
                        <div className="relative aspect-video">
                                {game.imageUrl ? (
                                    <Image src={game.imageUrl} alt={game.title} fill className="object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-muted" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                <div className="absolute bottom-2 left-3">
                                    <h3 className="text-xl font-bold text-white shadow-black [text-shadow:0_2px_4px_var(--tw-shadow-color)]">{game.title}</h3>
                                </div>
                            </div>
                        <CardContent className="p-4 space-y-4 flex-grow flex flex-col justify-between">
                            <div>
                            <p className="text-sm text-muted-foreground italic">"{rec.reason}"</p>
                            <div className="flex flex-wrap gap-2 mt-4">
                                <Badge variant="outline">{game.platform}</Badge>
                                {game.genres?.slice(0, 2).map(g => <Badge key={g} variant="secondary">{g}</Badge>)}
                            </div>
                            </div>
                            <Button onClick={() => handleMoveAndClose(game, 'Now Playing')} className="w-full mt-4 bg-accent hover:bg-accent/90">
                                <PlayCircle className="mr-2 h-4 w-4" />
                                Move to Now Playing
                            </Button>
                        </CardContent>
                        </Card>
                    )
                    })}
                </div>
                )}
            </div>
            </div>
        </DialogBody>

        <DialogFooter>
          <Button onClick={handleGetRecommendations} disabled={isLoading} className="w-full sm:w-auto">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {hasSuggestions 
                ? <><RefreshCw className="mr-2 h-4 w-4" /> Refresh Suggestions</>
                : <><Sparkles className="mr-2 h-4 w-4" /> Generate Recommendations</>
            }
          </Button>
        </DialogFooter>
        
      </DialogContent>
    </Dialog>
  );
};

export default Recommendations;
