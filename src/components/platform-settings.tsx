
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { USER_SELECTABLE_PLATFORMS, Platform, UserPreferences } from '@/lib/types';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { useToast } from '@/hooks/use-toast';
import { Separator } from './ui/separator';
import { useUserProfile } from '@/hooks/use-user-profile.tsx';
import { useAuth } from '@/hooks/use-auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Input } from './ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { SteamIcon } from './icons';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Info, Loader2 } from 'lucide-react';

const platformSettingsSchema = z.object({
  platforms: z.array(z.string()).min(1, 'Please select at least one platform.'),
  favoritePlatform: z.string({ required_error: 'Please select a favorite platform.' }),
  notifyDiscounts: z.boolean().optional(),
  playsOnSteamDeck: z.boolean().optional(),
  trackCompletionistPlaytime: z.boolean().optional(),
}).refine(data => [...data.platforms, 'Others/ROMs'].includes(data.favoritePlatform), {
  message: 'Favorite platform must be one of the selected platforms.',
  path: ['favoritePlatform'],
});

type PlatformSettingsFormValues = z.infer<typeof platformSettingsSchema>;

type PlatformSettingsProps = {
  isOnboarding?: boolean;
};

export default function PlatformSettings({ isOnboarding = false }: PlatformSettingsProps) {
  const router = useRouter();
  const { user, getAuthToken } = useAuth();
  const { preferences, savePreferences, loading: prefsLoading } = useUserPreferences();
  const { profile, loading: profileLoading, updateProfile } = useUserProfile();
  const { toast } = useToast();
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isUpdatingCompat, setIsUpdatingCompat] = useState(false);

  const [steamVanityId, setSteamVanityId] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);

  const form = useForm<PlatformSettingsFormValues>({
    resolver: zodResolver(platformSettingsSchema),
    defaultValues: {
      platforms: [],
      favoritePlatform: '',
      notifyDiscounts: false,
      playsOnSteamDeck: false,
      trackCompletionistPlaytime: false,
    },
  });
  
  useEffect(() => {
    if (profile?.steamId) {
      setSteamVanityId(profile.steamId);
    }
  }, [profile]);

  useEffect(() => {
    if (preferences) {
      form.reset({
        platforms: preferences.platforms || [],
        favoritePlatform: preferences.favoritePlatform || '',
        notifyDiscounts: preferences.notifyDiscounts || false,
        playsOnSteamDeck: preferences.playsOnSteamDeck || false,
        trackCompletionistPlaytime: preferences.trackCompletionistPlaytime || false,
      });
    }
  }, [preferences, form]);

  const [importStatus, setImportStatus] = useState<'idle' | 'pending' | 'complete' | 'failed'>('idle');

  // Listen for import status to show pending message on this page
  useEffect(() => {
    if (!user) return;
    const notificationDocRef = doc(getDb(), 'users', user.uid, 'notifications', 'steamImport');
    const unsubscribe = onSnapshot(notificationDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.status === 'pending') {
                setImportStatus('pending');
            } else if (data.status === 'acknowledged' || data.status === 'completed' || data.status === 'failed') {
                setImportStatus('idle');
            }
        } else {
            setImportStatus('idle');
        }
    });

    return () => unsubscribe();
  }, [user]);

  const selectedPlatforms = form.watch('platforms');
  const playsOnPC = useMemo(() => selectedPlatforms?.includes('PC') || false, [selectedPlatforms]);
  const playsOnSteamDeck = form.watch('playsOnSteamDeck');

  useEffect(() => {
    const pcWasUnchecked = form.formState.dirtyFields.platforms && !form.getValues('platforms').includes('PC');
    if (pcWasUnchecked) {
      form.setValue('playsOnSteamDeck', false);
      form.setValue('notifyDiscounts', false);
    }
  }, [playsOnPC, form]);


  async function onSubmit(data: PlatformSettingsFormValues) {
    if (!user) return;
    
    setIsUpdating(true);
    
    const finalPreferences: UserPreferences = {
      ...preferences,
      ...data,
      platforms: [...new Set([...data.platforms, 'Others/ROMs'])],
      // If PC is not selected, ensure PC-specific options are false
      notifyDiscounts: data.platforms.includes('PC') ? data.notifyDiscounts : false,
      playsOnSteamDeck: data.platforms.includes('PC') ? data.playsOnSteamDeck : false,
    };
    await savePreferences(finalPreferences);
    
    if (steamVanityId && steamVanityId !== profile?.steamId) {
       await updateProfile({ steamId: steamVanityId });
    }

    if (isOnboarding && !profile?.onboardingComplete) {
      await updateProfile({ onboardingComplete: true });
    }
    
    toast({
      title: 'Preferences Saved',
      description: 'Your platform and profile settings have been updated.',
    });

    setIsUpdating(false);

    if(isOnboarding) {
      router.push('/dashboard');
    }
  }
  
  const handleSteamImport = async (importMode: 'full' | 'new') => {
    setShowImportDialog(false);
    
    const isValid = await form.trigger();
    if (!isValid) {
      toast({
        title: 'Form Incomplete',
        description: 'Please fix the errors on the form before importing.',
        variant: 'destructive',
      });
      return;
    }
    
    // Save any pending changes before importing
    await savePreferences(form.getValues());
    if(steamVanityId !== profile?.steamId) {
       await updateProfile({ steamId: steamVanityId });
    }
    
    const currentSteamId = form.getValues().platforms.includes('PC') ? steamVanityId : '';

    if (!currentSteamId) {
      toast({
        title: 'Steam ID required',
        description: 'Please enter your Steam vanity URL or ID and save it before importing.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsImporting(true);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('You must be logged in to import your library.');

      if (user) {
        const notificationDocRef = doc(getDb(), 'users', user.uid, 'notifications', 'steamImport');
        // Set the status to pending to trigger the listener
        await setDoc(notificationDocRef, { status: 'pending', timestamp: new Date() });
      }

      const response = await fetch('/api/import-steam', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ steamId: currentSteamId, importMode }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to start import process.');
      
      toast({
        title: 'Steam Import Started',
        description: 'Your library import is running in the background. We will notify you when it is complete.',
      });

      if (isOnboarding) {
        router.push('/dashboard');
      }

    } catch (error: any) {
      toast({ title: 'Import Failed', description: error.message, variant: 'destructive' });
      // Reset pending status on failure
      if (user) {
        const notificationDocRef = doc(getDb(), 'users', user.uid, 'notifications', 'steamImport');
        await setDoc(notificationDocRef, { status: 'failed', message: error.message }, { merge: true });
      }
    } finally {
      setIsImporting(false);
    }
  }

  const handleUpdateCompat = async () => {
    setIsUpdatingCompat(true);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('You must be logged in.');
      
      const response = await fetch('/api/update-deck-compat', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      toast({
        title: 'Update Complete',
        description: 'Steam Deck compatibility status has been updated for all your PC games.',
      });
    } catch (error: any) {
      toast({ title: 'Update Failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsUpdatingCompat(false);
    }
  }
  
  const sortedFavoritePlatforms = useMemo(() => {
    if (!selectedPlatforms) return [];
    const uniquePlatforms = Array.from(new Set([...selectedPlatforms, "Others/ROMs"]));
    return uniquePlatforms.sort((a, b) => {
        if (a === 'Others/ROMs') return 1;
        if (b === 'Others/ROMs') return -1;
        return a.localeCompare(b);
    });
  }, [selectedPlatforms]);


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Platform Preferences</CardTitle>
            <CardDescription>
              Select the gaming platforms you use and pick your favorite. This will help us tailor your experience.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="platforms"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Your Platforms</FormLabel>
                    <FormDescription>
                      Select all the platforms you currently play on.
                    </FormDescription>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {USER_SELECTABLE_PLATFORMS.map((platform) => (
                      <FormField
                        key={platform}
                        control={form.control}
                        name="platforms"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={platform}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(platform)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, platform])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== platform
                                          )
                                        )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {platform === 'Nintendo Switch' ? 'Nintendo Switch (incl. Switch 2)' : platform}
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={true}
                            disabled={true}
                          />
                        </FormControl>
                        <FormLabel className="font-normal text-muted-foreground">
                          Others/ROMs
                        </FormLabel>
                      </FormItem>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedPlatforms && selectedPlatforms.length > 0 && (
              <FormField
                control={form.control}
                name="favoritePlatform"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Favorite Platform</FormLabel>
                    <FormDescription>
                      This will be the default platform when adding new games.
                    </FormDescription>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        {sortedFavoritePlatforms.map((platform) => (
                          <FormItem key={platform} className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value={platform} />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {platform === 'Nintendo Switch' ? 'Nintendo Switch (incl. Switch 2)' : platform}
                          </FormLabel>
                        </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <Separator />

            <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="trackCompletionistPlaytime"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Track "Completionist" Playtime
                        </FormLabel>
                        <FormDescription>
                          Show fields for 100% completion playtime estimates.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                {playsOnPC && (
                  <>
                    <FormField
                        control={form.control}
                        name="notifyDiscounts"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                Notify me about discounts for games on my Wishlist.
                              </FormLabel>
                              <FormDescription>
                                Checks for Steam deals on your PC wishlist games.
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    <FormField
                      control={form.control}
                      name="playsOnSteamDeck"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              I play on a Steam Deck.
                            </FormLabel>
                            <FormDescription>
                              This helps us recommend Steam Deck compatible games.
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    {playsOnSteamDeck && (
                      <div className="pl-4">
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={handleUpdateCompat}
                          disabled={isUpdatingCompat}
                        >
                          {isUpdatingCompat && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {isUpdatingCompat ? 'Updating...' : 'Update Compatibility Status'}
                        </Button>
                        <FormDescription className="mt-2">
                            Check for the latest Steam Deck compatibility status for all your PC games.
                        </FormDescription>
                      </div>
                    )}
                  </>
                )}
            </div>
            {playsOnPC && (
              <>
              <Separator />
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Steam Integration</h3>
                   {importStatus === 'pending' && (
                    <Alert className="mb-4">
                      <Info className="h-4 w-4" />
                      <AlertTitle>Import in Progress</AlertTitle>
                      <AlertDescription>
                        Your Steam library is currently being imported in the background. We'll notify you when it's complete. You can safely navigate away from this page.
                      </AlertDescription>
                    </Alert>
                    )}
                    <div className="space-y-2">
                    <FormLabel htmlFor='steamId'>Steam Profile URL or ID</FormLabel>
                    <Input 
                      id='steamId'
                      placeholder="e.g., https://steamcommunity.com/id/your-vanity-id/"
                      value={steamVanityId}
                      onChange={(e) => setSteamVanityId(e.target.value)}
                      disabled={importStatus === 'pending' || isImporting}
                    />
                     <FormDescription>
                      Your Steam profile must be set to public for imports to work.
                    </FormDescription>
                  </div>
                </div>
              </>
            )}
          </CardContent>
           <CardFooter className="flex flex-col items-start gap-4">
           <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Have Questions?</AlertTitle>
              <AlertDescription>
                Have any question about how the app works or the above settings? Check out our <Link href="/faq" className="font-semibold text-primary hover:underline">F.A.Q. page</Link> for detailed answers.
              </AlertDescription>
            </Alert>
            <Button type="submit" disabled={prefsLoading || isUpdating || (isOnboarding ? false : (isImporting || importStatus === 'pending'))}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isUpdating ? 'Saving...' : isOnboarding ? 'Continue' : 'Save Preferences'}
            </Button>
             {isOnboarding && playsOnPC && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Optional: Import Steam Library</AlertTitle>
                <AlertDescription>
                  After saving, you can import your Steam library below. Or, skip this for now and do it later from the Profile page.
                </AlertDescription>
              </Alert>
             )}
          </CardFooter>
        </Card>

        {playsOnPC && (
        <Card>
          <CardHeader>
            <CardTitle>Import Steam Library</CardTitle>
            <CardDescription>
              A 'Full Import' will replace all PC games in your library. 'Add New Games' will only import games you don't already have.
            </CardDescription>
          </CardHeader>
            <CardFooter>
              <AlertDialog open={showImportDialog} onOpenChange={setShowImportDialog}>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="default" size="lg" disabled={isImporting || profileLoading || !steamVanityId || importStatus === 'pending'} className="h-12 px-10 text-base bg-accent hover:bg-accent/90">
                  <SteamIcon className="mr-2 h-5 w-5" />
                  {isImporting || importStatus === 'pending' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isImporting || importStatus === 'pending' ? 'Importing...' : 'Import Steam Library'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Choose Import Mode</AlertDialogTitle>
                  <AlertDialogDescription>
                    A <span className="font-bold">Full Import</span> will remove all existing PC games from your library and replace them with your Steam library. This is good for a fresh start.
                    <br/><br/>
                    An <span className="font-bold">Add New Games</span> import will only add games from Steam that are not already in your library. This is useful for keeping your library up to date.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction disabled={isImporting} onClick={() => handleSteamImport('new')}>
                    Add New Games
                  </AlertDialogAction>
                  <AlertDialogAction disabled={isImporting} onClick={() => handleSteamImport('full')} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Full Import
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>
      )}
      </form>
    </Form>
  );
}

    