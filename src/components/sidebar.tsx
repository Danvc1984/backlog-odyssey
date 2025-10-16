
"use client";

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { LayoutDashboard, Library, User, ChevronDown, LogOut, Info, Trophy, HelpCircle } from 'lucide-react';
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarBody,
  SidebarContent,
  SidebarTrigger,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import React from 'react';
import type { GameList } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';

const gameLists: GameList[] = ['Now Playing', 'Backlog', 'Wishlist', 'Recently Played'];

const AppSidebar = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { signOut } = useAuth();
  const router = useRouter();
  const activeList = searchParams.get('list');
  const { toggleSidebar, state, isMobile } = useSidebar();

  const isLibraryRoute = pathname === '/library';

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const handleBodyClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    // On mobile, close sidebar if a link is clicked
    if (isMobile && target.closest('a')) {
      toggleSidebar();
      return;
    }

    if (state === 'expanded') {
      // If expanded, collapse if the click is on the background (not a link/button).
      if (!target.closest('a, button')) {
        toggleSidebar();
      }
    } else if (state === 'collapsed') {
      // If collapsed, expand if the click is NOT on a link/button.
      if (!target.closest('a, button')) {
        toggleSidebar();
      }
    }
  };

  return (
    <>
      <SidebarHeader>
        <SidebarTrigger />
      </SidebarHeader>
      <SidebarBody onClick={handleBodyClick}>
        <SidebarContent className="p-2 flex-grow">
          <SidebarMenu>
            <SidebarMenuItem>
                <div className='flex items-center'>
                    <Link href="/dashboard" className='flex-grow'>
                        <SidebarMenuButton isActive={pathname === '/dashboard'} tooltip="Dashboard" className='flex items-center justify-start gap-3'>
                        <LayoutDashboard />
                        <span className="group-data-[collapsible=icon]:hidden">Dashboard</span>
                        </SidebarMenuButton>
                    </Link>
                    <div className="w-6 shrink-0"></div>
                </div>
            </SidebarMenuItem>

            <Collapsible asChild defaultOpen={isLibraryRoute}>
              <SidebarMenuItem>
                <div className='flex items-center justify-between w-full'>
                  <Link href="/library?list=Now%20Playing" className='flex-grow'>
                    <SidebarMenuButton
                      isActive={isLibraryRoute}
                      tooltip="My Library"
                      className="w-full justify-start flex items-center gap-3"
                    >
                      <Library />
                      <span className="group-data-[collapsible=icon]:hidden">My Library</span>
                    </SidebarMenuButton>
                  </Link>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 group-data-[collapsible=icon]:hidden"
                    >
                      <ChevronDown className="h-4 w-4 transition-transform duration-200 [&[data-state=open]]:-rotate-180" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                </div>
                 <CollapsibleContent>
                  <ul className="pl-7 py-2 space-y-1 group-data-[collapsible=icon]:hidden">
                    {gameLists.map(list => (
                      <li key={list}>
                        <Link href={`/library?list=${encodeURIComponent(list)}`}>
                          <SidebarMenuButton
                            size="sm"
                            isActive={isLibraryRoute && activeList === list}
                            className={cn("w-full justify-start", (isLibraryRoute && activeList === list) && "bg-accent/50")}
                          >
                            {list}
                          </SidebarMenuButton>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>

            <SidebarMenuItem>
                 <div className='flex items-center'>
                    <Link href="/challenges" className='flex-grow'>
                        <SidebarMenuButton isActive={pathname === '/challenges'} tooltip="My Challenges" className='flex items-center justify-start gap-3'>
                        <Trophy />
                        <span className="group-data-[collapsible=icon]:hidden">My Challenges</span>
                        </SidebarMenuButton>
                    </Link>
                    <div className="w-6 shrink-0"></div>
                </div>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
                 <div className='flex items-center'>
                    <Link href="/profile" className='flex-grow'>
                        <SidebarMenuButton isActive={pathname === '/profile'} tooltip="My Profile" className='flex items-center justify-start gap-3'>
                        <User />
                        <span className="group-data-[collapsible=icon]:hidden">My Profile</span>
                        </SidebarMenuButton>
                    </Link>
                    <div className="w-6 shrink-0"></div>
                </div>
            </SidebarMenuItem>
             <SidebarMenuItem>
                 <div className='flex items-center'>
                    <Link href="/faq" className='flex-grow'>
                        <SidebarMenuButton isActive={pathname === '/faq'} tooltip="F.A.Q." className='flex items-center justify-start gap-3'>
                        <HelpCircle />
                        <span className="group-data-[collapsible=icon]:hidden">F.A.Q.</span>
                        </SidebarMenuButton>
                    </Link>
                    <div className="w-6 shrink-0"></div>
                </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className='p-2 pb-4 md:pb-16'>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleSignOut} tooltip="Sign Out">
                <LogOut />
                <span className="group-data-[collapsible=icon]:hidden">Sign Out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </SidebarBody>
    </>
  );
};

export default AppSidebar;
