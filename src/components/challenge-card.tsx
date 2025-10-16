
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Challenge } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CheckCircle, Target } from 'lucide-react';
import { format } from 'date-fns';

type ChallengeCardProps = {
  challenge: Challenge;
  isCompleted?: boolean;
};

const ChallengeCard: React.FC<ChallengeCardProps> = ({ challenge, isCompleted = false }) => {
  const progressPercentage = challenge.goal > 0 ? (challenge.progress / challenge.goal) * 100 : 0;

  return (
    <Card className={cn("flex flex-col", isCompleted && 'opacity-60')}>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          {isCompleted ? <CheckCircle className="mr-3 h-5 w-5 text-green-500" /> : <Target className="mr-3 h-5 w-5 text-primary" />}
          {challenge.title}
        </CardTitle>
        <CardDescription>
          {challenge.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-2">
          <Progress value={progressPercentage} />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progress</span>
            <span>{challenge.progress} / {challenge.goal}</span>
          </div>
        </div>
      </CardContent>
      {isCompleted && challenge.completedAt && (
         <CardFooter className="text-xs text-muted-foreground pt-4 pb-4">
            <p>Completed on: {format(challenge.completedAt.toDate(), 'PPP')}</p>
         </CardFooter>
      )}
    </Card>
  );
};

export default ChallengeCard;
