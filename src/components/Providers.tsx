"use client";

import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { HydrationProvider } from '@/contexts/HydrationContext';
import { Toaster as ShadcnToaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { FeatureFlagProvider } from './providers/FeatureFlagProvider';
import { ThemeProvider } from './providers/ThemeProvider';

// Validate required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_UNLEASH_URL',
  'NEXT_PUBLIC_UNLEASH_CLIENT_KEY',
  'NEXT_PUBLIC_UNLEASH_APP_NAME'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0 && process.env.NODE_ENV !== 'test') {
  console.warn(`Missing required environment variables: ${missingVars.join(', ')}`);
  console.warn('Feature flags will fall back to default values');
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000, // 30 seconds
    },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  const unleashConfig = {
    url: process.env.NEXT_PUBLIC_UNLEASH_URL || 'https://app.unleash-hosted.com/demo/api/',
    clientKey: process.env.NEXT_PUBLIC_UNLEASH_CLIENT_KEY || 'demo-app:default.9a5bcb937e5b9d3473de3bf99b3b9f9a1a7e42c7b2635959478dcb81',
    appName: process.env.NEXT_PUBLIC_UNLEASH_APP_NAME || 'water4weightloss-development',
  };

  return (
    <QueryClientProvider client={queryClient}>
      <FeatureFlagProvider unleashConfig={unleashConfig}>
        <ThemeProvider>
          <AuthProvider>
            <HydrationProvider>
              {children}
              <ShadcnToaster />
              <SonnerToaster position="top-right" richColors closeButton />
            </HydrationProvider>
          </AuthProvider>
        </ThemeProvider>
      </FeatureFlagProvider>
    </QueryClientProvider>
  );
}