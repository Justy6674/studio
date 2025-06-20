'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { UnleashProvider as BaseUnleashProvider } from '@unleash/nextjs';
import { FeatureFlagName, defaultFlags } from '@/lib/feature-flags';

interface FeatureFlagContextType {
  isEnabled: (flag: FeatureFlagName) => boolean;
  isLoading: boolean;
  error: Error | null;
}

const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(
  undefined
);

/**
 * Provider component that makes the feature flag API available to child components.
 * Wraps the UnleashProvider with our custom context.
 */
export function FeatureFlagProvider({
  children,
  unleashConfig,
}: {
  children: React.ReactNode;
  unleashConfig: {
    url: string;
    clientKey: string;
    appName: string;
  };
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [flags, setFlags] = useState<Record<FeatureFlagName, boolean>>(defaultFlags);

  // In a real implementation, this would fetch flags from Unleash
  // For now, we'll just use the default values
  useEffect(() => {
    const initializeFlags = async () => {
      try {
        // TODO: Replace with actual Unleash client initialization
        // const client = new UnleashClient(unleashConfig);
        // await client.start();
        // setFlags(client.getAllToggles());
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to initialize feature flags:', err);
        setError(err instanceof Error ? err : new Error('Failed to load feature flags'));
        setIsLoading(false);
      }
    };

    initializeFlags();
  }, [unleashConfig]);

  const isEnabled = (flag: FeatureFlagName): boolean => {
    // In a real implementation, this would check the Unleash client
    // For now, we'll just return the default value
    return flags[flag] ?? defaultFlags[flag];
  };

  return (
    <BaseUnleashProvider
      config={{
        url: unleashConfig.url,
        clientKey: unleashConfig.clientKey,
        appName: unleashConfig.appName,
        refreshInterval: 15, // Refresh flags every 15 seconds
      }}
    >
      <FeatureFlagContext.Provider value={{ isEnabled, isLoading, error }}>
        {children}
      </FeatureFlagContext.Provider>
    </BaseUnleashProvider>
  );
}

/**
 * Hook to access feature flags in components
 * @example
 * const { isEnabled, isLoading } = useFeatureFlag('new-navigation');
 */
export function useFeatureFlag(flag: FeatureFlagName) {
  const context = useContext(FeatureFlagContext);
  
  if (context === undefined) {
    throw new Error('useFeatureFlag must be used within a FeatureFlagProvider');
  }

  return {
    isEnabled: context.isEnabled(flag),
    isLoading: context.isLoading,
    error: context.error,
  };
}

/**
 * Higher-Order Component for feature flag-based conditional rendering
 * @example
 * <FeatureFlag flag="new-navigation" fallback={<OldNavigation />}>
 *   <NewNavigation />
 * </FeatureFlag>
 */
export function FeatureFlag({
  flag,
  children,
  fallback = null,
}: {
  flag: FeatureFlagName;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { isEnabled, isLoading } = useFeatureFlag(flag);

  if (isLoading) {
    return null; // Or a loading spinner
  }

  return <>{isEnabled ? children : fallback}</>;
}
