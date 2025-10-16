
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut, User } from 'firebase/auth';
import { getAuth, getDb } from '@/lib/firebase';
import type { AuthFormValues, UserProfile } from '@/lib/types';
import { doc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithEmail: (values: AuthFormValues) => Promise<any>;
  signUpWithEmail: (values: AuthFormValues) => Promise<any>;
  signOut: () => Promise<void>;
  getAuthToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const getAuthToken = async () => {
    const auth = getAuth();
    if (auth.currentUser) {
        return auth.currentUser.getIdToken();
    }
    return null;
  }

  const signInWithEmail = async ({ email, password }: AuthFormValues) => {
    return signInWithEmailAndPassword(getAuth(), email, password);
  };

  const signUpWithEmail = async ({ email, password }: AuthFormValues) => {
    const userCredential = await createUserWithEmailAndPassword(getAuth(), email, password);
    const user = userCredential.user;

    if (user) {
      // Create user profile document in Firestore
      const userProfileRef = doc(getDb(), 'users', user.uid);
      const newUserProfile: UserProfile = {
        onboardingComplete: false,
      };
      await setDoc(userProfileRef, newUserProfile);
    }
    return userCredential;
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(getAuth());
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithEmail, signUpWithEmail, signOut, getAuthToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
