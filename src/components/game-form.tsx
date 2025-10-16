
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import { Search, Image as ImageIcon, Calendar as CalendarIcon, Star, CheckCircle, Repeat } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import type { Game, GameList, Platform, Genre } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import Image from 'next/image';
import { MultiSelect } from './ui/multi-select';
import { cn } from '@/lib/utils';
import { Calendar } from './ui/calendar';


const gameSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters.'),
  platform: z.custom<Platform>(val => typeof val === 'string' && val.length > 0, 'Platform is required.'),
  genres: z.array(z.string()).min(1, 'Please select at least one genre.'),
  list: z.enum(["Wishlist", "Backlog", "Now Playing", "Recently Played"]),
  releaseDate: z.string().optional(),
  playtimeNormally: z.coerce.number().optional(),
  playtimeCompletely: z.coerce.number().optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  replayCount: z.coerce.number().min(0).optional(),
});

type GameFormValues = z.infer<typeof gameSchema>;

type GameFormProps = {
  onSave: (game: Omit<Game, 'id' | 'userId'>) => void;
  defaultList?: GameList;
  allGenres: Genre[];
  onAddGenre: (genre: Genre) => void;
  gameToEdit?: Game | null;
};

const API_KEY = process.env.NEXT_PUBLIC_RAWG_API_KEY;

const mapRawgPlatform = (rawgPlatform: string): Platform | 'Other' => {
  if (rawgPlatform === 'PC') return 'PC';
  if (/^PlayStation 5/.test(rawgPlatform)) return 'PlayStation';
  if (/^Xbox Series S\/X/.test(rawgPlatform)) return 'Xbox';
  if (/^Nintendo Switch( 2)?$/.test(rawgPlatform)) return 'Nintendo Switch';
  return 'Others/ROMs';
};

const GameForm: React.FC<GameFormProps> = ({ onSave, defaultList = 'Wishlist', allGenres, onAddGenre, gameToEdit }) => {
  const { toast } = useToast();
  const { preferences } = useUserPreferences();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedGameImageUrl, setSelectedGameImageUrl] = useState<string | null>(null);
  const [newGenre, setNewGenre] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const isEditing = !!gameToEdit;
  
  const form = useForm<GameFormValues>({
    resolver: zodResolver(gameSchema),
    defaultValues: {
      title: gameToEdit?.title || '',
      platform: gameToEdit?.platform || preferences?.favoritePlatform,
      genres: gameToEdit?.genres || [],
      list: gameToEdit?.list || defaultList,
      releaseDate: gameToEdit?.releaseDate || '',
      playtimeNormally: gameToEdit?.playtimeNormally,
      playtimeCompletely: gameToEdit?.playtimeCompletely,
      rating: gameToEdit?.rating || 0,
      replayCount: gameToEdit?.replayCount || 0,
    },
  });

  useEffect(() => {
    if (gameToEdit) {
      form.reset({
        title: gameToEdit.title,
        platform: gameToEdit.platform,
        genres: gameToEdit.genres,
        list: gameToEdit.list,
        releaseDate: gameToEdit.releaseDate,
        playtimeNormally: gameToEdit.playtimeNormally,
        playtimeCompletely: gameToEdit.playtimeCompletely,
        rating: gameToEdit.rating,
        replayCount: gameToEdit.replayCount,
      });
      setSelectedGameImageUrl(gameToEdit.imageUrl);
      setSearchTerm(gameToEdit.title);
    } else {
      form.reset({
        title: '',
        platform: preferences?.favoritePlatform,
        genres: [],
        list: defaultList,
        releaseDate: '',
        playtimeNormally: undefined,
        playtimeCompletely: undefined,
        rating: 0,
        replayCount: 0,
      });
      setSelectedGameImageUrl(null);
      setSearchTerm('');
    }
  }, [gameToEdit, defaultList, form, preferences]);

  const searchGames = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await axios.get('https://api.rawg.io/api/games', {
        params: {
          key: API_KEY,
          search: query,
          page_size: 10,
        },
      });
      setSearchResults(response.data.results);
    } catch (error) {
      console.error('Error fetching from RAWG API:', error);
      setSearchResults([]);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearchResults([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchContainerRef]);

  useEffect(() => {
    // Do not trigger search on initial load of an existing game.
    // Only search if it's a new game or if the title has been manually changed.
    if (isEditing && searchTerm === gameToEdit?.title) {
        return;
    }
    
    const delayDebounceFn = setTimeout(() => {
      searchGames(searchTerm);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, searchGames, isEditing, gameToEdit?.title]);

  const handleSelectGame = async (game: any) => {
    form.setValue('title', game.name);
    setSearchTerm(game.name);
    
    const favoritePlatform = preferences?.favoritePlatform;
    const userPlatforms = preferences?.platforms || [];
    
    const rawgPlatformNames: string[] = game.platforms?.map((p: any) => p.platform.name) || [];
    const mappedPlatforms: Platform[] = rawgPlatformNames.map(mapRawgPlatform).filter(p => p !== 'Other') as Platform[];

    let platformToSet: Platform | undefined;

    if (favoritePlatform && mappedPlatforms.includes(favoritePlatform)) {
      platformToSet = favoritePlatform;
    } else {
      platformToSet = mappedPlatforms.find(p => userPlatforms.includes(p));
    }
    
    if (!platformToSet) {
      platformToSet = 'Others/ROMs';
    }

    form.setValue('platform', platformToSet);

    const gameGenres = game.genres?.map((g: any) => g.name) as Genre[] || [];
    if (gameGenres.length > 0) {
      gameGenres.forEach(genre => onAddGenre(genre));
      form.setValue('genres', gameGenres);
    }

    if (game.released) form.setValue('releaseDate', game.released);
    
    if (game.playtime) form.setValue('playtimeNormally', game.playtime);

    if (game.background_image) {
      setSelectedGameImageUrl(game.background_image);
    } else {
      setSelectedGameImageUrl(null);
    }
    setSearchResults([]);

    try {
        const response = await fetch(`/api/get-time-to-beat?title=${encodeURIComponent(game.name)}`);
        if (response.ok) {
            const data = await response.json();
            if (data.playtimeNormally !== null) {
                form.setValue('playtimeNormally', data.playtimeNormally);
            }
            if (data.playtimeCompletely !== null) {
                form.setValue('playtimeCompletely', data.playtimeCompletely);
            }
        }
    } catch (error) {
        console.warn(`Could not fetch time-to-beat for ${game.name}:`, error);
    }
  };

  async function onSubmit(data: GameFormValues) {
    const newGame: Omit<Game, 'id' | 'userId'> = { 
      ...data,
      imageUrl: selectedGameImageUrl || '',
    };

    if (data.rating === 0 || !data.rating) {
      delete newGame.rating;
    }

    if (data.replayCount === 0 || !data.replayCount) {
      delete newGame.replayCount;
    }
    
    onSave(newGame);
    if(!gameToEdit) {
      toast({
        title: <div className="flex items-center gap-2"><CheckCircle /> Game Added!</div>,
        description: `${data.title} has been added to your library.`,
      });
      form.reset({ title: '', platform: preferences?.favoritePlatform, genres: [], list: defaultList, releaseDate: '', playtimeNormally: undefined, playtimeCompletely: undefined, rating: 0, replayCount: 0 });
      setSelectedGameImageUrl(null);
    }
  }

  const handleAddNewGenre = () => {
    if (newGenre && !allGenres.map(g => g.toLowerCase()).includes(newGenre.toLowerCase())) {
      onAddGenre(newGenre as Genre);
      form.setValue('genres', [...form.getValues('genres'), newGenre]);
      setNewGenre('');
    }
  };

  const sortedPlatforms = useMemo(() => {
    if (!preferences?.platforms) return [];
    return [...preferences.platforms].sort((a, b) => {
      if (a === 'Others/ROMs') return 1;
      if (b === 'Others/ROMs') return -1;
      return a.localeCompare(b);
    });
  }, [preferences?.platforms]);

  const ratingValue = form.watch('rating') || 0;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
        <div className="relative" ref={searchContainerRef}>
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      placeholder="Search for a game..." 
                      {...field} 
                      onChange={(e) => {
                        field.onChange(e);
                        setSearchTerm(e.target.value);
                      }}
                       autoComplete="off"
                    />
                     <Search className="absolute top-1/2 right-3 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg">
                <div className="max-h-64 overflow-y-auto">
                    {searchResults.map((game) => (
                      <div
                        key={game.id}
                        onClick={() => handleSelectGame(game)}
                        className="flex items-center justify-start gap-2 h-auto p-2 rounded-md cursor-pointer hover:bg-muted"
                      >
                        {game.background_image ? <Image
                          src={game.background_image}
                          alt={game.name}
                          width={40}
                          height={53}
                          className="object-cover rounded-sm aspect-[3/4]"
                        /> : <div className="w-10 h-[53px] bg-card rounded-sm flex items-center justify-center"><ImageIcon className="h-5 w-5 text-muted-foreground"/></div>}
                        <span className="text-sm font-medium text-left">{game.name}</span>
                      </div>
                    ))}
                </div>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-4">
                <FormField
                    control={form.control}
                    name="platform"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Platform</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select a platform" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {sortedPlatforms.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="releaseDate"
                    render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Release Date</FormLabel>
                        <Popover>
                        <PopoverTrigger asChild>
                            <FormControl>
                            <Button
                                variant={"outline"}
                                className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                                )}
                            >
                                {field.value ? (
                                format(new Date(field.value), "PPP")
                                ) : (
                                <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                            captionLayout="dropdown-buttons"
                            fromYear={1900}
                            toYear={new Date().getFullYear() + 5}
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                            disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                            />
                        </PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
            <FormField
            control={form.control}
            name="genres"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Genres</FormLabel>
                <MultiSelect
                    options={allGenres.map(g => ({ value: g, label: g }))}
                    onValueChange={field.onChange}
                    value={field.value}
                    placeholder="Select genres"
                />
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <div className="space-y-2">
          <FormLabel>Add Another Genre</FormLabel>
          <div className="flex gap-2">
            <Input 
              placeholder="e.g. Metroidvania" 
              value={newGenre}
              onChange={(e) => setNewGenre(e.target.value)}
            />
            <Button type="button" variant="outline" onClick={handleAddNewGenre}>Add</Button>
          </div>
        </div>
       
        <div className="grid grid-cols-2 gap-4">
           <FormField
            control={form.control}
            name="playtimeNormally"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Story Playtime (hrs)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g. 40" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           {preferences?.trackCompletionistPlaytime && (
            <FormField
                control={form.control}
                name="playtimeCompletely"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Completionist (hrs)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g. 100" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="rating"
            render={({ field }) => (
              <FormItem>
                  <FormLabel>Rating</FormLabel>
                  <FormControl>
                      <div className="flex items-center justify-between">
                          <div 
                              className="flex items-center gap-1"
                              onMouseLeave={() => setHoverRating(0)}
                          >
                          {[1, 2, 3, 4, 5].map((starValue) => (
                              <Star
                                  key={starValue}
                                  className={cn(
                                      "h-6 w-6 cursor-pointer transition-colors",
                                      (hoverRating >= starValue || ratingValue >= starValue)
                                      ? "text-yellow-400 fill-yellow-400"
                                      : "text-muted-foreground"
                                  )}
                                  onMouseEnter={() => setHoverRating(starValue)}
                                  onClick={() => {
                                      const newRating = starValue === ratingValue ? 0 : starValue;
                                      field.onChange(newRating);
                                  }}
                              />
                          ))}
                          </div>
                          <span className="text-sm font-bold text-yellow-400">{ratingValue ? `${ratingValue}/5` : 'N/A'}</span>
                      </div>
                  </FormControl>
                  <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="replayCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Replay Count</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input type="number" min="0" placeholder="e.g. 3" {...field} value={field.value || ''} className="pl-8" />
                    <Repeat className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="list"
          render={({ field }) => (
            <FormItem>
              <FormLabel>List</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Add to a list" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(["Wishlist", "Backlog", "Now Playing", "Recently Played"] as GameList[]).map(l => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-accent hover:bg-accent/90">{gameToEdit ? 'Save Changes' : 'Add Game'}</Button>
      </form>
    </Form>
  );
};

export default GameForm;

    