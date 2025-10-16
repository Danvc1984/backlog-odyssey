
'use client';
import { useMemo, useState } from 'react';
import type { Game, Challenge, ChallengeIdea } from '@/lib/types';
import Dashboard from '@/components/dashboard';
import { useGameLibrary } from '@/hooks/use-game-library';

import GameListPreview from '@/components/game-list-preview';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from '@/components/ui/dialog';
import GameForm from '@/components/game-form';
import { useDeals } from '@/hooks/use-deals';
import { Loader2 } from 'lucide-react';
import UpNextQueue from '@/components/up-next-queue';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function DashboardPage() {
  const {
    games,
    activeChallenges,
    allGenres,
    loading,
    handleUpdateGame,
    handleMoveGame,
    handleDeleteGame,
    handleAddGenre,
    handleAddChallenge,
    confirmDeleteGame,
    setDeletingGame,
    deletingGame,
    editingGame,
    setEditingGame,
    isEditFormOpen,
    setEditFormOpen,
  } = useGameLibrary();

  const { deals } = useDeals();
  const [isChallengeFormOpen, setChallengeFormOpen] = useState(false);

  const nowPlaying = useMemo(
    () => games.filter(g => g.list === 'Now Playing').slice(0, 5),
    [games]
  );
  const backlog = useMemo(
    () => games.filter(g => g.list === 'Backlog').slice(0, 5),
    [games]
  );
  const wishlist = useMemo(
    () => games.filter(g => g.list === 'Wishlist').slice(0, 5),
    [games]
  );
  const recentlyPlayed = useMemo(
    () => games.filter(g => g.list === 'Recently Played').slice(0, 5),
    [games]
  );

  const onAddChallenge = async (data: ChallengeIdea) => {
    await handleAddChallenge(data);
    setChallengeFormOpen(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[calc(100vh-200px)]">
          <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-12">
        <Dashboard 
          games={games} 
          activeChallenges={activeChallenges} 
          isChallengeFormOpen={isChallengeFormOpen} 
          setChallengeFormOpen={setChallengeFormOpen} 
          onAddChallenge={onAddChallenge}
        />
        
        <UpNextQueue games={games} onMoveGame={handleMoveGame} activeChallenges={activeChallenges} />

        <GameListPreview title="Now Playing" games={nowPlaying} onEdit={setEditingGame} onMove={handleMoveGame} onDelete={confirmDeleteGame} />
        <GameListPreview title="Backlog" games={backlog} onEdit={setEditingGame} onMove={handleMoveGame} onDelete={confirmDeleteGame} />
        <GameListPreview title="Wishlist" games={wishlist} deals={deals} onEdit={setEditingGame} onMove={handleMoveGame} onDelete={confirmDeleteGame} />
        <GameListPreview title="Recently Played" games={recentlyPlayed} onEdit={setEditingGame} onMove={handleMoveGame} onDelete={confirmDeleteGame} />

        <Dialog open={isEditFormOpen} onOpenChange={setEditFormOpen}>
          <DialogContent className="sm:max-w-[425px]" onOpenAutoFocus={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>Edit Game</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <GameForm 
                onSave={handleUpdateGame} 
                allGenres={allGenres} 
                onAddGenre={handleAddGenre}
                gameToEdit={editingGame} 
              />
            </DialogBody>
          </DialogContent>
        </Dialog>
        
        <AlertDialog open={!!deletingGame} onOpenChange={() => setDeletingGame(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete "{deletingGame?.title}" from your library.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeletingGame(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleDeleteGame(deletingGame!)}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
