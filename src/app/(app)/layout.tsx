
'use client';
import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import AppHeader from '@/components/header';
import AppSidebar from '@/components/sidebar';
import {
  SidebarProvider,
  Sidebar,
  SidebarBody,
  SidebarContent,
  SidebarInset,
} from '@/components/ui/sidebar';
import { UserPreferencesProvider, useUserPreferences } from '@/hooks/use-user-preferences';
import { UserProfileProvider, useUserProfile } from '@/hooks/use-user-profile';
import { DealsProvider, useDeals } from '@/hooks/use-deals';
import { GameLibraryProvider, useGameLibrary } from '@/hooks/use-game-library';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

function AppContent({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const { preferences } = useUserPreferences();
  const { fetchDeals } = useDeals();
  const { games: allGames, activeChallenges } = useGameLibrary();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [initialLoadComplete, setInitialLoadComplete] = React.useState(false);
  const dealsFetchedRef = React.useRef(false);

  React.useEffect(() => {
    if (!authLoading && !profileLoading) {
      setInitialLoadComplete(true);
    }
  }, [authLoading, profileLoading]);

  React.useEffect(() => {
    if (!initialLoadComplete) {
      return;
    }

    if (!user) {
      router.push('/login');
      return;
    }

    if (!profile?.onboardingComplete && pathname !== '/settings/platform') {
      router.push('/settings/platform');
    }
  }, [user, profile, initialLoadComplete, router, pathname]);
  
  React.useEffect(() => {
    if (allGames.length > 0 && preferences?.notifyDiscounts && !dealsFetchedRef.current) {
        const wishlistGames = allGames.filter(g => g.list === 'Wishlist' && g.platform === 'PC' && g.steamAppId);
        const steamAppIds = wishlistGames.map(g => g.steamAppId as number);
        
        if (steamAppIds.length > 0) {
            fetchDeals(steamAppIds, true); // Pass true to show toast only if deals are found
            dealsFetchedRef.current = true; // Mark as fetched to prevent re-fetching on component re-renders
        }
    }
  }, [allGames, preferences, fetchDeals]);

  // Global listener for Steam Import notifications
  React.useEffect(() => {
    if (!user) return;
    const notificationDocRef = doc(getDb(), 'users', user.uid, 'notifications', 'steamImport');
    const unsubscribe = onSnapshot(notificationDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.status === 'completed' || data.status === 'failed') {
                 toast({
                    title: data.status === 'completed' ? 'Steam Import Complete' : 'Steam Import Failed',
                    description: data.message,
                    variant: data.status === 'failed' ? 'destructive' : 'default',
                    duration: 10000,
                 });
                 // Acknowledge the notification to prevent it from showing again
                 setDoc(notificationDocRef, { status: 'acknowledged' }, { merge: true }).catch(console.error);
            }
        }
    });

    return () => unsubscribe();
  }, [user, toast]);
  
  if (!initialLoadComplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading user data...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Redirecting to login...</p>
      </div>
    );
  }

  if (!profile?.onboardingComplete) {
    if (pathname === '/settings/platform') {
      return <>{children}</>;
    }
    return (
       <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Redirecting to setup...</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <AppSidebar />
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col min-h-screen p-4 md:p-6 lg:p-8">
          <AppHeader allGames={allGames} activeChallenges={activeChallenges} />
          <main className="flex-grow mt-6 md:mt-8">
            {children}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}


export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProfileProvider>
      <UserPreferencesProvider>
        <GameLibraryProvider>
          <DealsProvider>
            <AppContent>{children}</AppContent>
          </DealsProvider>
        </GameLibraryProvider>
      </UserPreferencesProvider>
    </UserProfileProvider>
  )
}
