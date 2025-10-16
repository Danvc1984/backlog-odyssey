
'use client';

import React, { useMemo } from 'react';
import { Game } from '@/lib/types';
import { Card, CardContent } from './ui/card';
import Image from 'next/image';

type BacklogFlowProps = {
  games: Game[];
};

const StatCard = ({ count, label, className }: { count: number, label: string, className?: string }) => (
    <Card className={`bg-black/20 backdrop-blur-xs text-center border-none shadow-none p-2 ${className}`}>
        <CardContent className="p-0">
            <span className="text-3xl font-bold text-primary">{count}</span>
            <p className="text-sm font-bold ">{label}</p>
        </CardContent>
    </Card>
);

const BacklogFlow: React.FC<BacklogFlowProps> = ({ games }) => {
  const counts = useMemo(() => {
    return {
      backlog: games.filter(g => g.list === 'Backlog').length,
      nowPlaying: games.filter(g => g.list === 'Now Playing').length,
      recentlyPlayed: games.filter(g => g.list === 'Recently Played').length,
    };
  }, [games]);

  return (
    <div className="relative w-full h-full flex items-center justify-center mt-[40px]" >
      <div className="relative mt-2">
        <Image 
          src="/hourglass.webp" 
          alt="Hourglass flow" 
          width={450} 
          height={550}
          className="object-contain"
          priority
        />
        
        <div className="absolute top-[12%] left-1/2 -translate-x-1/2">
          <StatCard count={counts.backlog} label="Games to Play" />
        </div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <StatCard count={counts.nowPlaying} label="Now Playing" />
        </div>

        <div className="absolute bottom-[12%] left-1/2 -translate-x-1/2">
          <StatCard count={counts.recentlyPlayed} label="Completed" />
        </div>
      </div>
    </div>
  );
};

export default BacklogFlow;
