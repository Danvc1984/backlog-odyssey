import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Game, GameList } from '@/lib/types';
import { platformIcons, steamDeckCompatIcons, steamDeckCompatTooltips, ratingTooltips } from '@/components/icons';
import { Calendar, Clock, ImageOff, FolderKanban, Pencil, Trash2, Star, Sparkles, BookOpen, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu';
import { motion } from 'framer-motion';
import React from 'react';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { cn } from '@/lib/utils';
import type { Deal } from '@/hooks/use-deals';

type GameCardProps = {
  game: Game;
  deal?: Deal;
  onEdit: (game: Game) => void;
  onMove: (game: Game, newList: GameList) => void;
  onDelete: (game: Game) => void;
  priority?: boolean;
};

const gameLists: GameList[] = ["Now Playing", "Backlog", "Wishlist", "Recently Played"];

const GameCard: React.FC<GameCardProps> = ({ game, deal, onEdit, onMove, onDelete, priority = false }) => {
  const { preferences } = useUserPreferences();
  const PlatformIcon = platformIcons[game.platform];
  const SteamDeckCompatIcon = game.steamDeckCompat ? steamDeckCompatIcons[game.steamDeckCompat] : null;

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    onEdit(game);
  }

  const showSteamDeckCompat = preferences?.playsOnSteamDeck && game.platform === 'PC' && game.steamDeckCompat && SteamDeckCompatIcon;
  const hasTopRightInfo = (game.rating && game.rating > 0) || showSteamDeckCompat;

  const showDealBadge = deal && preferences?.notifyDiscounts;

  return (
    <motion.div layout className="relative group">
       <Card className="h-full flex flex-col transition-all duration-300 group-hover:shadow-lg group-hover:shadow-primary/20 border-transparent group-hover:scale-105">
        <div className="p-0 relative aspect-[4/3] sm:aspect-video rounded-t-lg overflow-hidden">
          {game.imageUrl ? (
            <Image
              src={game.imageUrl}
              alt={game.title}
              fill
              priority={priority}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
              className="object-cover rounded-t-lg"
            />
          ) : (
            <div className="w-full h-full bg-card flex items-center justify-center rounded-t-lg">
              <ImageOff className="w-16 h-16 text-muted-foreground" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent rounded-t-lg" />
          <div className="absolute bottom-0 left-0 p-4">
              <CardTitle className="text-lg font-bold text-white shadow-black [text-shadow:0_2px_4px_var(--tw-shadow-color)] line-clamp-2">
                {game.title}
              </CardTitle>
          </div>
          {showDealBadge && (
            <div className="absolute top-2 left-2">
              <Badge 
                className={cn(
                  'text-white shadow-lg flex items-center gap-1 border-none',
                  deal.discountPercent < 40 && 'bg-green-500 hover:bg-green-500',
                  deal.discountPercent >= 40 && deal.discountPercent < 80 && 'bg-green-600 hover:bg-green-600',
                  deal.discountPercent >= 80 && 'bg-green-700 hover:bg-green-700'
                )}
              >
                {deal.discountPercent >= 80 && <Sparkles className="h-3 w-3" />}
                -{deal.discountPercent}%
              </Badge>
            </div>
          )}
        </div>
        <CardContent className="p-4 flex-grow space-y-2">
          <div className="flex justify-between items-start text-xs text-muted-foreground">
            <div className="space-y-1">
              {game.list === 'Recently Played' && game.dateCompleted && (
                <div className="flex items-center text-green-400">
                  <CheckCircle className="h-3 w-3 mr-1.5" />
                  Completed: {format(game.dateCompleted.toDate(), 'MMM d, yyyy')}
                </div>
              )}
              {game.releaseDate && (
                <div className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1.5" />
                  {format(new Date(game.releaseDate), 'MMM yyyy')}
                </div>
              )}
                <div className="flex items-center">
                  <BookOpen className="h-3 w-3 mr-1.5" />
                   Story: {game.playtimeNormally ? `${game.playtimeNormally}h` : 'Not Listed'}
                </div>
               {preferences?.trackCompletionistPlaytime && (
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1.5" />
                    Completionist: {game.playtimeCompletely ? `${game.playtimeCompletely}h` : 'Not Listed'}
                  </div>
               )}
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex-shrink-0">
              <Button size="icon" variant="outline" className="h-7 w-7" onClick={handleEdit}>
                <Pencil className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" className="h-7 w-7 bg-primary/80 hover:bg-primary text-primary-foreground">
                    <FolderKanban className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {gameLists.filter(l => l !== game.list).map(list => (
                    <DropdownMenuItem key={list} onClick={() => onMove(game, list)}>
                      Move to {list}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-500" onClick={() => onDelete(game)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className='flex flex-wrap gap-2 pt-2'>
            <Link href={`/library?platform=${game.platform}`}>
              <Badge variant="secondary" className="flex items-center gap-1 cursor-pointer hover:bg-primary/20">
                {PlatformIcon && <PlatformIcon className="h-3 w-3" />}
                {game.platform}
              </Badge>
            </Link>
            {(game.genres || []).map(genre => {
              return (
                <Link href={`/library?genre=${genre}`} key={genre}>
                  <Badge variant="secondary" className="cursor-pointer hover:bg-primary/20">
                    {genre}
                  </Badge>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
      {hasTopRightInfo && (
        <div className="absolute top-2 right-2 flex flex-col items-end gap-2 z-10 transition-transform duration-300 group-hover:-translate-y-1">
            <div className="flex items-center gap-2 bg-background/80 rounded-full px-2 py-1 backdrop-blur-sm">
                {game.rating && game.rating > 0 && (
                    <Tooltip>
                        <TooltipTrigger>
                            <div className="flex items-center gap-1">
                                <span className="text-sm font-bold text-yellow-400">{game.rating}</span>
                                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{ratingTooltips[game.rating]}</p>
                        </TooltipContent>
                    </Tooltip>
                )}
                {showSteamDeckCompat && (
                    <Tooltip>
                    <TooltipTrigger>
                        <SteamDeckCompatIcon className={cn("h-4 w-4", {
                            'text-green-400': ['native', 'platinum', 'gold'].includes(game.steamDeckCompat as string),
                            'text-yellow-400': ['silver', 'bronze'].includes(game.steamDeckCompat as string),
                            'text-destructive': game.steamDeckCompat === 'borked',
                            'text-muted-foreground': game.steamDeckCompat === 'unknown'
                        })} />
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{steamDeckCompatTooltips[game.steamDeckCompat!]}</p>
                    </TooltipContent>
                    </Tooltip>
                )}
            </div>
        </div>
      )}
    </motion.div>
  );
};

export default React.memo(GameCard);
