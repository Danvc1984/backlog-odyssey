
'use client';
import React, { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, PlayCircle, Loader2, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import Autoplay from 'embla-carousel-autoplay';

import type { Game, GameList, Challenge } from '@/lib/types';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from './ui/badge';
import { platformIcons } from './icons';
import { useGameLibrary } from '@/hooks/use-game-library';
import ExternalRecommendation from './external-recommendation';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';

interface UpNextQueueProps {
  games: Game[];
  activeChallenges: Challenge[];
  onMoveGame: (game: Game, list: GameList) => void;
}

const UpNextCard: React.FC<{ game: Game & { reason: string }; onMoveGame: (game: Game, list: GameList) => void }> = ({ game, onMoveGame }) => {
    const PlatformIcon = platformIcons[game.platform];
    return (
        <Card className="h-full flex flex-col group border-transparent">
            <div className="relative aspect-video overflow-hidden rounded-t-lg">
                {game.imageUrl ? (
                <Image
                    src={game.imageUrl}
                    alt={game.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                ) : (
                <div className="bg-muted w-full h-full" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-4 left-4">
                <h3 className="text-xl font-bold text-white shadow-black [text-shadow:0_2px_4px_var(--tw-shadow-color)]">{game.title}</h3>
                </div>
            </div>
            <CardContent className="p-4 flex-grow flex flex-col justify-between">
                <div>
                <p className="text-sm text-muted-foreground italic mb-3">"{game.reason}"</p>
                <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="flex items-center gap-1">
                        {PlatformIcon && <PlatformIcon className="h-3 w-3" />}
                        {game.platform}
                    </Badge>
                    {(game.genres || []).slice(0, 2).map(genre => (
                        <Badge key={genre} variant="secondary">{genre}</Badge>
                    ))}
                </div>
                </div>
                <Button className="w-full mt-4 bg-accent hover:bg-accent/90" onClick={() => onMoveGame(game, 'Now Playing')}>
                <PlayCircle className="mr-2 h-4 w-4" />
                Move to Now Playing
                </Button>
            </CardContent>
        </Card>
    );
};


const UpNextQueue: React.FC<UpNextQueueProps> = ({ games, activeChallenges, onMoveGame }) => {
  const {
    upNextSuggestions,
    upNextLoading,
    fetchUpNextSuggestions,
  } = useGameLibrary();
  
  const [isExternalRecOpen, setExternalRecOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (upNextSuggestions.length === 0 && games.length > 0) {
        fetchUpNextSuggestions();
    }
  }, [fetchUpNextSuggestions, games, upNextSuggestions.length]);


  const upNextGames = useMemo(() => {
    return upNextSuggestions
      .map(suggestion => {
        const game = games.find(g => g.id === suggestion.gameId);
        return game ? { ...game, reason: suggestion.reason } : null;
      })
      .filter((g): g is Game & { reason: string } => g !== null);
  }, [upNextSuggestions, games]);
  
  const mobileSuggestions = upNextGames.slice(0, 2);

  return (
    <div className="space-y-6">
       <div className="flex flex-row items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
                <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Up Next</h2>
            </div>
            <p className="text-muted-foreground md:ml-11">Based on your library and preferences, here are some games we think you'll love next.</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
             <Tooltip>
                <TooltipTrigger asChild>
                    <Button onClick={() => setExternalRecOpen(true)} variant="ghost" size="icon" className="w-16 h-16 sm:w-20 sm:h-20 rounded-full hover:bg-transparent transition-colors duration-300 p-0 shadow-primary-glow" style={{ boxShadow: `0 0 15px 3px hsl(var(--primary) / 0.4)` }}>
                        <Image src="/blackholesun.webp" alt="Discover a new game" width={80} height={80} className="animate-spin-slow rounded-full" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                <p>Discover a new game</p>
                </TooltipContent>
            </Tooltip>
            <Button variant="link" onClick={fetchUpNextSuggestions} size="sm" disabled={upNextLoading} className="text-xs">
                <RefreshCw className="mr-1 h-3 w-3" /> Refresh
            </Button>
        </div>
      </div>
      
      {upNextLoading ? (
         <div className="flex items-center justify-center h-40 gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <p>Curating your next adventure...</p>
         </div>
      ) : upNextGames.length > 0 ? (
          <>
            {isMobile ? (
                <div className="grid grid-cols-1 gap-6">
                    {mobileSuggestions.map((game, index) => (
                        <motion.div
                            key={game.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: index * 0.2, ease: "circOut" }}
                            className="p-1 h-full"
                        >
                            <UpNextCard game={game} onMoveGame={onMoveGame} />
                        </motion.div>
                    ))}
                </div>
            ) : (
                <Carousel
                    opts={{
                    align: 'start',
                    loop: true,
                    }}
                    plugins={[
                        Autoplay({
                        delay: 4000,
                        stopOnInteraction: true,
                        }),
                    ]}
                    className="w-full"
                >
                    <CarouselContent>
                    {upNextGames.map((game, index) => (
                        <CarouselItem key={game.id} className="md:basis-1/2 lg:basis-1/3">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: index * 0.2, ease: "circOut" }}
                                className="p-1 h-full"
                            >
                                <UpNextCard game={game} onMoveGame={onMoveGame} />
                            </motion.div>
                        </CarouselItem>
                    ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-0" />
                    <CarouselNext className="right-0" />
                </Carousel>
            )}
        </>
      ) : null}

      <ExternalRecommendation 
        isOpen={isExternalRecOpen}
        onOpenChange={setExternalRecOpen}
        allGames={games}
        activeChallenges={activeChallenges}
      />
    </div>
  );
};

export default UpNextQueue;
