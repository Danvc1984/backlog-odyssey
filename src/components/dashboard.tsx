
'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Link from 'next/link';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Game, Challenge, ChallengeIdea } from '@/lib/types';
import { useMemo } from 'react';
import BacklogFlow from './backlog-flow';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { steamDeckCompatIcons } from './icons';
import { cn } from '@/lib/utils';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogBody } from './ui/dialog';
import { Button } from './ui/button';
import { PlusCircle, ArrowRight } from 'lucide-react';
import ChallengeForm from './challenge-form';
import ChallengeCard from './challenge-card';

type DashboardProps = {
  games: Game[];
  activeChallenges: Challenge[];
  isChallengeFormOpen: boolean;
  setChallengeFormOpen: (isOpen: boolean) => void;
  onAddChallenge: (data: ChallengeIdea) => void;
};

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const Dashboard: React.FC<DashboardProps> = ({ games, activeChallenges, isChallengeFormOpen, setChallengeFormOpen, onAddChallenge }) => {
  
  const { preferences } = useUserPreferences();

  const ownedGames = useMemo(() => games.filter(g => g.list !== 'Wishlist'), [games]);
  const totalGames = ownedGames.length;

  const completionRate = useMemo(() => {
    const completedCount = ownedGames.filter(g => g.list === 'Recently Played').length;
    if (ownedGames.length === 0) return 0;
    return Math.round((completedCount / ownedGames.length) * 100);
  }, [ownedGames]);

  const { totalPlaytimeNormally, totalPlaytimeCompletely, averagePlaytime } = useMemo(() => {
    const gamesWithPlaytime = ownedGames.filter(g => g.playtimeNormally);
    if (gamesWithPlaytime.length === 0) return { totalPlaytimeNormally: 0, totalPlaytimeCompletely: 0, averagePlaytime: 0 };
    
    const totalPlaytimeNormally = ownedGames.reduce((acc, game) => acc + (game.playtimeNormally || 0), 0);
    const totalPlaytimeCompletely = ownedGames.reduce((acc, game) => acc + (game.playtimeCompletely || 0), 0);
    
    const averagePlaytime = gamesWithPlaytime.length > 0 ? Math.round(totalPlaytimeNormally / gamesWithPlaytime.length) : 0;
    return { totalPlaytimeNormally, totalPlaytimeCompletely, averagePlaytime };
  }, [ownedGames]);

  const platformData = useMemo(() => {
    const counts = ownedGames.reduce((acc, game) => {
      acc[game.platform] = (acc[game.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(counts)
        .map(([name, count]) => ({ name, count, fill: `var(--color-${name.replace(/ /g, '-')})` }))
        .sort((a,b) => b.count - a.count);
  }, [ownedGames]);
  
  const platformColorConfig = useMemo(() => {
    const config: any = {};
    const chartColors = ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5'];
    platformData.forEach((item, index) => {
        config[item.name.replace(/ /g, '-')] = {
            label: item.name,
            color: `hsl(var(--${chartColors[index % chartColors.length]}))`
        };
    });
    return config;
  }, [platformData]);

  const deckCompatData = useMemo(() => {
    const pcGames = ownedGames.filter(g => g.platform === 'PC');
    const data = { Verified: 0, Playable: 0, Unsupported: 0, Unknown: 0 };
    pcGames.forEach(game => {
        switch (game.steamDeckCompat) {
            case 'native':
            case 'platinum':
                data.Verified++;
                break;
            case 'gold':
            case 'silver':
            case 'bronze':
                data.Playable++;
                break;
            case 'borked':
                data.Unsupported++;
                break;
            default:
                data.Unknown++;
                break;
        }
    });
    return data;
  }, [ownedGames]);
  
 const gamesByGenreData = useMemo(() => {
    const data = ownedGames.reduce((acc, game) => {
        (game.genres || []).forEach(genre => {
            acc[genre] = (acc[genre] || 0) + 1;
        });
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(data)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
}, [ownedGames]);

  const genreColorConfig = useMemo(() => {
    const config: any = {};
    gamesByGenreData.slice(0, 5).forEach((item, index) => {
      config[item.name] = {
        label: item.name,
        color: `hsl(var(--chart-${(index % 5) + 1}))`,
      };
    });
    return config;
  }, [gamesByGenreData]);

  return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-[auto_320px_400px] gap-6">
            <Card className="min-h-[700px] border-none">
                <CardHeader>
                    <CardTitle>Backlog Hourglass</CardTitle>
                    <CardDescription>An overview of your gaming journey.</CardDescription>
                </CardHeader>
                <CardContent className="h-[550px] w-full flex items-center justify-center">
                    <BacklogFlow games={games} />
                </CardContent>
            </Card>

            <div className="space-y-6">
                <Card className="border-none">
                    <div className="flex justify-around items-center h-full">
                        <div className="text-center p-4 w-1/2">
                            <CardTitle className="text-sm font-medium">Total Owned Games</CardTitle>
                            <div className="text-2xl font-bold mt-2">{totalGames}</div>
                            <p className="text-xs text-muted-foreground">in your active library</p>
                        </div>
                        <Separator orientation="vertical" className="h-20" />
                        <div className="text-center p-4 w-1/2">
                             <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                            <div className="text-2xl font-bold mt-2">{completionRate}%</div>
                            <p className="text-xs text-muted-foreground">Based on owned games</p>
                        </div>
                    </div>
                </Card>
                <Card className="border-none">
                     <div className="flex justify-around items-center h-full">
                        <div className="text-center p-4 w-1/2">
                            <CardTitle className="text-sm font-medium">Average Playtime</CardTitle>
                            <div className="text-2xl font-bold mt-2">{averagePlaytime}h</div>
                            <p className="text-xs text-muted-foreground">Estimated story length</p>
                        </div>
                        <Separator orientation="vertical" className="h-20" />
                        <div className="text-center p-4 w-1/2">
                           <CardTitle className="text-sm font-medium">Total Playtime</CardTitle>
                            <div className="text-2xl font-bold mt-2">{totalPlaytimeNormally}h</div>
                             <p className="text-xs text-muted-foreground">
                                {preferences?.trackCompletionistPlaytime && totalPlaytimeCompletely > 0
                                ? `(${totalPlaytimeCompletely}h for 100%)`
                                : 'Normal story playtime'}
                            </p>
                        </div>
                    </div>
                </Card>
                {preferences?.playsOnSteamDeck && (
                    <Card className="border-none">
                        <CardHeader>
                            <CardTitle className="text-lg font-medium">Steam Deck Compatibility</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {(Object.keys(deckCompatData) as Array<keyof typeof deckCompatData>).map(key => {
                                const compatKey = key === 'Verified' ? 'gold' : key === 'Playable' ? 'silver' : key === 'Unsupported' ? 'borked' : 'unknown';
                                const Icon = steamDeckCompatIcons[compatKey];
                                const count = deckCompatData[key];
                                const colorClass = 
                                    key === 'Verified' ? 'text-green-400' :
                                    key === 'Playable' ? 'text-yellow-400' :
                                    key === 'Unsupported' ? 'text-destructive' :
                                    'text-muted-foreground';

                                return (
                                    <div key={key} className="flex items-center gap-3">
                                        <Icon className={cn("h-8 w-8", colorClass)} />
                                        <span className="font-semibold text-lg">{key}:</span>
                                        <span className="text-lg font-bold">{count}</span>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                )}
            </div>
            
             <Card className="border-none">
                <CardHeader>
                    <CardTitle>Games by Genre</CardTitle>
                    <CardDescription>Your top 5 genres by game count.</CardDescription>
                </CardHeader>
                <CardContent className="h-[450px]">
                    <ChartContainer config={genreColorConfig} className="w-full h-full">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                data={gamesByGenreData.slice(0, 5)} 
                                dataKey="value" 
                                nameKey="name" 
                                cx="50%" 
                                cy="50%" 
                                outerRadius="80%"
                                labelLine={false}
                                label={({ cx, cy, midAngle, innerRadius, outerRadius, value, index, percent }) => {
                                    if (percent < 0.05) return null; // Hide label if too small
                                    const RADIAN = Math.PI / 180;
                                    const radius = innerRadius + (outerRadius - innerRadius) * 1.2;
                                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                    return (
                                        <text
                                        x={x}
                                        y={y}
                                        fill="hsl(var(--foreground))"
                                        textAnchor={x > cx ? 'start' : 'end'}
                                        dominantBaseline="central"
                                        className="text-xs"
                                        >
                                        {gamesByGenreData[index].name} ({value})
                                        </text>
                                    );
                                }}
                                >
                                    {gamesByGenreData.slice(0, 5).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <Card className="border-none">
                <CardHeader>
                    <CardTitle>Platform Distribution</CardTitle>
                    <CardDescription>Your library across platforms.</CardDescription>
                </CardHeader>
                <CardContent>
                     <ChartContainer config={platformColorConfig} className="h-[250px] w-full">
                        <BarChart accessibilityLayer data={platformData} layout="vertical" margin={{ right: 20, left: 10 }}>
                            <CartesianGrid horizontal={false} />
                            <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={80} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                            <XAxis type="number" hide />
                            <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                            <Bar dataKey="count" radius={4}>
                            {platformData.map((entry, index) => (
                                <Cell key={`cell-${entry.name}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                            </Bar>
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
            <Card className="border-none">
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
                     <div>
                        <CardTitle>Personal Challenges</CardTitle>
                        <CardDescription>Give yourself a goal to work towards!</CardDescription>
                     </div>
                     <div className="flex items-center gap-2 self-end sm:self-center">
                        <Button variant="link" asChild>
                            <Link href="/challenges">View All <ArrowRight className="ml-1 h-4 w-4" /></Link>
                        </Button>
                        <Dialog open={isChallengeFormOpen} onOpenChange={setChallengeFormOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="animate-subtle-glow"><PlusCircle className="mr-2 h-4 w-4" /> Add</Button>
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
                </CardHeader>
                <CardContent>
                {activeChallenges.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-1">
                        {activeChallenges.slice(0, 2).map(challenge => (
                            <ChallengeCard key={challenge.id} challenge={challenge} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 text-muted-foreground bg-card rounded-lg h-full flex items-center justify-center">
                        <p>No active challenges. Why not create one?</p>
                    </div>
                )}
                </CardContent>
            </Card>
        </div>
    </div>
  );
};

export default Dashboard;
