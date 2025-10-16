
'use client';

import { LogOut, User as UserIcon, Menu } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import Recommendations from './recommendations';
import type { Game, Challenge } from '@/lib/types';
import Image from 'next/image';
import { SidebarTrigger } from './ui/sidebar';

type AppHeaderProps = {
  allGames?: Game[];
  activeChallenges?: Challenge[];
}

const AppHeader = ({ allGames = [], activeChallenges = []}: AppHeaderProps) => {
  const { user, signOut, loading } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <header className="flex items-center justify-between gap-3 text-primary">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="md:hidden">
          <Menu />
        </SidebarTrigger>
        <Image src="/logo.webp" alt="Backlog Odyssey" width={280} height={70} className="hidden md:block" />
        <Image src="/logo.webp" alt="Backlog Odyssey" width={140} height={35} className="block md:hidden" />
      </div>

      <div className='flex items-center gap-2 sm:gap-4'>
        <Recommendations allGames={allGames} activeChallenges={activeChallenges} />
        {loading ? (
          <div className="h-10 w-10 bg-muted rounded-full animate-pulse" />
        ) : user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                  <AvatarFallback>
                    <UserIcon />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/profile')}>
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button onClick={() => router.push('/login')}>Sign In</Button>
        )}
      </div>
    </header>
  );
};

export default AppHeader;
