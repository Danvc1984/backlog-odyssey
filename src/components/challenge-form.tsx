
'use client';

import { useState } from 'react';
import { Wand2, Loader2, Lightbulb } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Game, ChallengeIdea } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from './ui/card';

type ChallengeFormProps = {
  onSave: (data: ChallengeIdea) => void;
  allGames: Game[];
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


const ChallengeForm: React.FC<ChallengeFormProps> = ({ onSave, allGames }) => {
  const [isLoadingIdeas, setIsLoadingIdeas] = useState(false);
  const [ideas, setIdeas] = useState<ChallengeIdea[]>([]);
  const { toast } = useToast();

  const handleGetIdeas = async () => {
    setIsLoadingIdeas(true);
    setIdeas([]);
    try {
      const { generateChallengeIdeas } = await import('@/ai/flows/generate-challenge-ideas');
      const result = await generateChallengeIdeas({ 
        gameLibrary: allGames.map(g => ({
          title: g.title,
          platform: g.platform,
          genres: g.genres,
          list: g.list,
          releaseDate: safeToISOString(g.releaseDate),
          dateAdded: safeToISOString(g.dateAdded),
          dateCompleted: safeToISOString(g.dateCompleted),
          replayCount: g.replayCount,
        })) 
      });
      setIdeas(result.ideas);
    } catch (error) {
      console.error('Failed to get challenge ideas:', error);
      toast({
        title: 'Error',
        description: 'Could not generate ideas. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingIdeas(false);
    }
  };

  return (
    <div className="space-y-6 py-4">
        <Button 
            type="button" 
            variant="outline" 
            className="w-full" 
            onClick={handleGetIdeas} 
            disabled={isLoadingIdeas}
        >
            <Wand2 className="mr-2 h-4 w-4" />
            {ideas.length > 0 ? 'Suggest Different Ideas' : 'Suggest Ideas With AI'}
        </Button>
       
        {isLoadingIdeas && (
            <div className="flex justify-center items-center h-48 flex-col gap-4">
                <Loader2 className="mr-2 h-8 w-8 animate-spin" />
                <p className="text-muted-foreground">Generating personalized challenges...</p>
            </div>
        )}

        {ideas.length > 0 && !isLoadingIdeas && (
        <div className="space-y-4">
            <h4 className="text-sm font-medium text-center text-muted-foreground">Select a challenge to begin:</h4>
            <div className="flex flex-col gap-3">
            {ideas.map((idea, index) => (
                <Card 
                    key={index}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => onSave(idea)}
                >
                    <CardHeader className="flex-row items-center gap-4 space-y-0 p-4">
                        <Lightbulb className="h-6 w-6 text-primary flex-shrink-0" />
                        <div>
                            <CardTitle className="text-base">{idea.title}</CardTitle>
                            <CardDescription>{idea.description}</CardDescription>
                        </div>
                    </CardHeader>
                </Card>
            ))}
            </div>
        </div>
        )}
    </div>
  );
};

export default ChallengeForm;
