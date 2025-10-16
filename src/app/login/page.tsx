'use client';

import { Swords, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import LoginForm from '@/components/login-form';
import SignUpForm from '@/components/signup-form';
import Image from 'next/image';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(true);

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  if (loading || user) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading...</p>
        </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="flex items-center justify-center mb-8">
        <Image src="/logo.webp" alt="Backlog Odyssey" width={280} height={70} className="hidden md:block" priority />
        <Image src="/logo.webp" alt="Backlog Odyssey" width={210} height={52.5} className="block md:hidden" priority />
      </div>
      <div className="w-full max-w-sm p-8 space-y-6 bg-card rounded-lg shadow-lg">
        {showLogin ? (
          <>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-card-foreground">Welcome Back</h2>
              <p className="text-muted-foreground">Sign in to continue to your backlog</p>
            </div>
            <LoginForm />
            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Button variant="link" className="p-0 h-auto" onClick={() => setShowLogin(false)}>
                Sign Up
              </Button>
            </p>
          </>
        ) : (
          <>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-card-foreground">Create an Account</h2>
              <p className="text-muted-foreground">Get started with your game backlog</p>
            </div>
            <SignUpForm onSignUp={() => setShowLogin(true)} />
             <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Button variant="link" className="p-0 h-auto" onClick={() => setShowLogin(true)}>
                Sign In
              </Button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
