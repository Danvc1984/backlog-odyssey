
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Loader2, Sparkles, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Game, Challenge } from '@/lib/types';
import { generateExternalRecommendation, GenerateExternalRecommendationOutput } from '@/ai/flows/generate-external-recommendation';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { useGameLibrary } from '@/hooks/use-game-library';

type ExternalRecommendationProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  allGames: Game[];
  activeChallenges: Challenge[];
};

type RecommendationResult = GenerateExternalRecommendationOutput & {
    imageUrl?: string;
    releaseDate?: string;
};

const safeToISOString = (date: any): string | undefined => {
  if (date && typeof date.toDate === 'function') {
    return date.toDate().toISOString();
  }
  if (typeof date === 'string') {
    return date;
  }
  return undefined;
};


const ExternalRecommendation: React.FC<ExternalRecommendationProps> = ({ isOpen, onOpenChange, allGames, activeChallenges }) => {
  const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { preferences } = useUserPreferences();
  const { handleAddGame } = useGameLibrary();

  const handleGetRecommendation = async () => {
    if (!preferences) {
      toast({
        title: 'Preferences not loaded',
        description: 'Please wait a moment and try again.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    setRecommendation(null);
    try {
        const aiResult = await generateExternalRecommendation({
             gameLibrary: allGames.map(g => ({
                id: g.id,
                title: g.title,
                platform: g.platform,
                genres: g.genres,
                list: g.list,
                rating: g.rating,
                playtimeNormally: g.playtimeNormally,
                playtimeCompletely: g.playtimeCompletely,
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
            userPreferences: {
                platforms: preferences.platforms,
                trackCompletionistPlaytime: !!preferences.trackCompletionistPlaytime,
            }
        });

        const gameDetailsResponse = await fetch(`/api/rawg/get-game-details?title=${encodeURIComponent(aiResult.title)}`);
        
        let finalResult: RecommendationResult = { ...aiResult };

        if (gameDetailsResponse.ok) {
            const details = await gameDetailsResponse.json();
            finalResult.imageUrl = details.game.background_image;
            finalResult.releaseDate = details.game.released;
        }

        setRecommendation(finalResult);

    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Failed to get recommendation. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      handleGetRecommendation();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleAddAndClose = async (rec: RecommendationResult) => {
    await handleAddGame({
      title: rec.title,
      platform: preferences?.favoritePlatform || 'PC', // Default to something sensible
      genres: rec.genres,
      list: 'Wishlist',
      imageUrl: rec.imageUrl || '',
      releaseDate: rec.releaseDate,
    });
    handleDialogClose();
  };

  const handleDialogClose = () => {
    onOpenChange(false);
    setRecommendation(null);
    setIsLoading(false);
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
        handleDialogClose();
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="text-primary" />
            Discover Your Next Game
          </DialogTitle>
          <DialogDescription>
            Here’s a recommendation from outside your library, chosen just for you.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
            <div className="min-h-[300px] flex items-center justify-center">
                {isLoading && (
                    <div className="flex flex-col items-center gap-4 text-muted-foreground">
                        <Loader2 className="w-12 h-12 animate-spin text-primary" />
                        <p>Contacting the cosmos for a recommendation...</p>
                    </div>
                )}
                {recommendation && (
                    <Card className="bg-card/50 overflow-hidden flex flex-col group border-none shadow-none w-full">
                        <div className="relative aspect-video">
                            {recommendation.imageUrl ? (
                                <Image src={recommendation.imageUrl} alt={recommendation.title} fill className="object-cover" />
                            ) : (
                                <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
                                    No Image Available
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                            <div className="absolute bottom-2 left-3">
                                <h3 className="text-2xl font-bold text-white shadow-black [text-shadow:0_2px_4px_var(--tw-shadow-color)]">{recommendation.title}</h3>
                            </div>
                        </div>
                        <CardContent className="p-4 space-y-4 flex-grow flex flex-col justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground italic">"{recommendation.reason}"</p>
                            <div className="flex flex-wrap gap-2 mt-4">
                                {recommendation.genres?.map(g => <Badge key={g} variant="secondary">{g}</Badge>)}
                            </div>
                        </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DialogBody>
         {recommendation && (
            <DialogFooter>
                <Button onClick={() => handleAddAndClose(recommendation)} className="w-full sm:w-auto">
                    Add to Wishlist
                </Button>
                <Button onClick={handleGetRecommendation} variant="outline" disabled={isLoading} className="w-full sm:w-auto">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Suggest Another
                </Button>
            </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ExternalRecommendation;
