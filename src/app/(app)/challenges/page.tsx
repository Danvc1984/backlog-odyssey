
'use client';

import { useState } from 'react';
import { Trophy, Target, PlusCircle, Loader2 } from 'lucide-react';

import type { Challenge, ChallengeIdea } from '@/lib/types';
import { useGameLibrary } from '@/hooks/use-game-library';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogBody } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import ChallengeForm from '@/components/challenge-form';
import ChallengeCard from '@/components/challenge-card';

export default function ChallengesPage() {
    const {
        games,
        activeChallenges,
        completedChallenges,
        loading,
        handleAddChallenge,
    } = useGameLibrary();
    
    const [isChallengeFormOpen, setChallengeFormOpen] = useState(false);

    const onAddChallenge = async (data: ChallengeIdea) => {
        await handleAddChallenge(data);
        setChallengeFormOpen(false);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[calc(100vh-200px)]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                    <p className="text-muted-foreground">Loading challenges...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-12">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-primary">My Challenges</h2>
                    <p className="text-muted-foreground">Track your gaming goals and celebrate your victories.</p>
                </div>
                <Dialog open={isChallengeFormOpen} onOpenChange={setChallengeFormOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="animate-subtle-glow"><PlusCircle className="mr-2 h-4 w-4" /> Add Challenge</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create a New Challenge</DialogTitle>
                        </DialogHeader>
                        <DialogBody>
                            <ChallengeForm onSave={onAddChallenge} allGames={games} />
                        </DialogBody>
                    </DialogContent>
                </Dialog>
            </div>
            
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
                        <Target className="text-primary"/> Active Challenges
                    </h2>
                </div>
                {activeChallenges.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {activeChallenges.map(challenge => (
                            <ChallengeCard key={challenge.id} challenge={challenge} />
                        ))}
                    </div>
                ) : (
                     <div className="text-center py-10 text-muted-foreground bg-card rounded-lg">
                        <p>No active challenges. Why not create one?</p>
                    </div>
                )}
            </div>

            <Separator />

            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
                        <Trophy className="text-yellow-400"/> Completed Challenges
                    </h2>
                </div>
                {completedChallenges.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {completedChallenges.map(challenge => (
                            <ChallengeCard key={challenge.id} challenge={challenge} isCompleted />
                        ))}
                    </div>
                ) : (
                     <div className="text-center py-10 text-muted-foreground bg-card rounded-lg">
                        <p>No completed challenges yet. Keep playing!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
