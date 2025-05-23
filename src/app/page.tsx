"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton'; // Or a more elaborate loader

export default function HomePage() {
  const { user, initialLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!initialLoading) {
      if (user) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [user, initialLoading, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="space-y-4 w-full max-w-xs text-center">
        <svg className="mx-auto h-12 w-12 animate-spin text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-lg font-medium text-foreground">Loading HydrateAI...</p>
        <Skeleton className="h-4 w-3/4 mx-auto mt-2" />
      </div>
    </div>
  );
}
