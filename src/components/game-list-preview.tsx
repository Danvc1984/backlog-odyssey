
'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Game, GameList } from '@/lib/types';
import type { Deal } from '@/hooks/use-deals';
import GameCard from '@/components/game-card';
import { Button } from '@/components/ui/button';
import { useUserPreferences } from '@/hooks/use-user-preferences';

type GameListPreviewProps = {
  title: GameList | 'Now Playing' | 'Backlog' | 'Wishlist' | 'Recently Played';
  games: Game[];
  deals?: Record<string, Deal>;
  onEdit: (game: Game) => void;
  onMove: (game: Game, newList: GameList) => void;
  onDelete: (game: Game) => void;
};

const GameListPreview: React.FC<GameListPreviewProps> = ({ title, games, deals, onEdit, onMove, onDelete }) => {
  const isWishlist = title === 'Wishlist';
  const { preferences } = useUserPreferences();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-primary">
          {title}
        </h2>
        <Button variant="link" asChild>
          <Link href={`/library?list=${encodeURIComponent(title)}`}>
            View full list <ArrowRight className="ml-2" />
          </Link>
        </Button>
      </div>
      {games.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {games.map((game, index) => (
            <GameCard 
              key={game.id} 
              game={game} 
              deal={isWishlist && game.steamAppId && deals && preferences?.notifyDiscounts ? deals[game.steamAppId] : undefined}
              onEdit={() => onEdit(game)}
              onMove={onMove} 
              onDelete={onDelete}
              priority={index === 0 && title === 'Now Playing'}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-muted-foreground bg-card rounded-lg">
          <p>No games in this list.</p>
            <Button variant="link" asChild className="mt-2">
              <Link href={`/library?list=${encodeURIComponent(title)}`}>Add some games to this collection!</Link>
            </Button>
        </div>
      )}
    </div>
  );
};

export default GameListPreview;
