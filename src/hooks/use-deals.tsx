
'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { useToast } from './use-toast';
import { BadgePercent } from 'lucide-react';

export interface Deal {
  discountPercent: number;
  finalFormatted: string;
}

interface DealsContextType {
  deals: Record<string, Deal>;
  loading: boolean;
  fetchDeals: (appIds: number[], silent?: boolean) => Promise<void>;
}

const DealsContext = createContext<DealsContextType | undefined>(undefined);

export const DealsProvider = ({ children }: { children: ReactNode }) => {
  const [deals, setDeals] = useState<Record<string, Deal>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchDeals = useCallback(async (appIds: number[], silent = false) => {
    if (appIds.length === 0) {
      if (!silent) {
        toast({ title: 'No Steam games in Wishlist', description: 'There are no PC games with a Steam ID in your wishlist to check for deals.' });
      }
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/steam/get-discounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ appIds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API request failed with status ${response.status}`);
      }

      const data = await response.json();
      setDeals(data.deals || {});

      const foundDealsCount = Object.keys(data.deals || {}).length;
      if (foundDealsCount > 0) {
        toast({
          title: <div className="flex items-center gap-2"><BadgePercent /> Deals Found!</div>,
          description: `Found discounts for ${foundDealsCount} game(s) in your wishlist.`,
        });
      } else {
        if (!silent) {
          toast({
            title: 'No Deals Found',
            description: 'None of the games in your wishlist have a discount on Steam right now.',
          });
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch deals:', error);
      if (!silent) {
        toast({
          title: 'Error Fetching Deals',
          description: error.message || 'An unexpected error occurred.',
          variant: 'destructive',
        });
      }
      setDeals({});
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return (
    <DealsContext.Provider value={{ deals, loading, fetchDeals }}>
      {children}
    </DealsContext.Provider>
  );
};

export const useDeals = () => {
  const context = useContext(DealsContext);
  if (context === undefined) {
    throw new Error('useDeals must be used within a DealsProvider');
  }
  return context;
};
