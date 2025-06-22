"use client";

import { ReactNode, useState, useEffect, useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { HydrationProvider } from '@/contexts/HydrationContext';
import { Toaster as ShadcnToaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { ThemeProvider } from './providers/ThemeProvider';

/**
 * Creating the QueryClient instance outside component
 * to prevent reinstantiation on every render
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000, // 30 seconds
    },
  },
});

/**
 * Environment variable helper that works in both server and client contexts safely
 * without causing hydration mismatches or render loops.
 */
function useNextPublicEnvVars() {
  // Only check these once during initialization, not on every render
  // This prevents unnecessary re-renders and flickering
  const [checkedEnv] = useState(() => {
    // Define required vars
    const requiredEnvVars = [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    ];
    
    // Only log warnings once during development
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
      if (missingVars.length > 0) {
        console.warn(`Missing required environment variables: ${missingVars.join(', ')}`);
        console.warn('Ensure these are set in .env.local or Vercel environment variables');
      }
    }
    
    return true;
  });

  return checkedEnv;
}

export function Providers({ children }: { children: ReactNode }) {
  // Check environment variables safely without causing render loops
  useNextPublicEnvVars();
  
  // Memoize the provider structure to prevent unnecessary re-renders
  const providers = useMemo(() => {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <HydrationProvider>
              {children}
              <ShadcnToaster />
              <SonnerToaster position="top-right" richColors closeButton />
            </HydrationProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  }, [children]);

  return providers;
}