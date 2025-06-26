"use client";

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Skeleton } from '@/components/ui/skeleton';
import { HydrationFAB } from '@/components/HydrationFAB';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <div className="space-y-4 w-full max-w-xs">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-secondary/50 dark:bg-background">
      <Header />
      <main className="flex-1 py-4">
        {children}
      </main>
      <footer className="py-6 text-center text-xs text-muted-foreground border-t border-border">
        By Downscale &copy; {new Date().getFullYear()}
      </footer>
      <HydrationFAB />
    </div>
  );
}