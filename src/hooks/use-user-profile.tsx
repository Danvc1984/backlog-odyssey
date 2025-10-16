
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { useAuth } from './use-auth';
import { UserProfile } from '@/lib/types';

interface UserProfileContextType {
  profile: UserProfile | null;
  loading: boolean;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const UserProfileContext = createContext<UserProfileContextType>({
  profile: null,
  loading: true,
  updateProfile: async () => {},
});

export const useUserProfile = () => useContext(UserProfileContext);

export const UserProfileProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (user) {
      const profileDocRef = doc(getDb(), 'users', user.uid);
      const unsubscribe = onSnapshot(profileDocRef, (docSnap) => {
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }, (error) => {
        console.error("Error fetching user profile:", error);
        setProfile(null);
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user, authLoading]);

  const updateProfile = useCallback(async (data: Partial<UserProfile>) => {
    if (user) {
        const profileDocRef = doc(getDb(), 'users', user.uid);
        await updateDoc(profileDocRef, data);
    }
  }, [user]);

  return (
    <UserProfileContext.Provider value={{ profile, loading, updateProfile }}>
      {children}
    </UserProfileContext.Provider>
  );
};
