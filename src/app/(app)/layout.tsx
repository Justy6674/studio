"use client";

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Skeleton } from '@/components/ui/skeleton';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, initialLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!initialLoading && !user) {
      router.replace('/login');
    }
  }, [user, initialLoading, router]);

  if (initialLoading || !user) {
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
      <main className="flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
      <footer className="py-6 text-center text-xs text-muted-foreground border-t border-border">
        HydrateAI &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
