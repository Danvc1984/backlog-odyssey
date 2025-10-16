
'use client';
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { useAuth } from './use-auth';
import type { UserPreferences } from '@/lib/types';

interface UserPreferencesContextType {
  preferences: UserPreferences | null;
  loading: boolean;
  savePreferences: (newPreferences: Partial<UserPreferences>) => Promise<void>;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export const UserPreferencesProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setLoading(true);
      const prefDocRef = doc(getDb(), 'users', user.uid, 'preferences', 'platform');
      const unsubscribe = onSnapshot(prefDocRef, (docSnap) => {
        if (docSnap.exists()) {
          setPreferences(docSnap.data() as UserPreferences);
        } else {
          setPreferences(null);
        }
        setLoading(false);
      }, (error) => {
        console.error("Error fetching user preferences:", error);
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      setPreferences(null);
      setLoading(false);
    }
  }, [user]);

  const savePreferences = useCallback(async (newPreferences: Partial<UserPreferences>) => {
    if (user) {
      const prefDocRef = doc(getDb(), 'users', user.uid, 'preferences', 'platform');
      await setDoc(prefDocRef, newPreferences, { merge: true });
    }
  }, [user]);

  return (
    <UserPreferencesContext.Provider value={{ preferences, loading, savePreferences }}>
      {children}
    </UserPreferencesContext.Provider>
  );
};

export const useUserPreferences = () => {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
};
