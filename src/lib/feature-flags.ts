/**
 * Feature Flag Configuration
 * 
 * This file defines all feature flags used in the application.
 * Flags should be documented with their purpose and expected lifetime.
 */

export type FeatureFlag = {
  name: string;
  description: string;
  defaultValue: boolean;
  isExperimental?: boolean;
  targetUsers?: 'all' | 'beta' | 'internal';
};

/**
 * List of all feature flags in the application.
 * Follow naming convention: kebab-case for flag names.
 */
export const featureFlags: Record<string, FeatureFlag> = {
  newNavigation: {
    name: 'new-navigation',
    description: 'Enables the new bottom navigation bar',
    defaultValue: false,
    isExperimental: true,
    targetUsers: 'beta',
  },
  fabEnabled: {
    name: 'fab-enabled',
    description: 'Enables the floating action button for quick actions',
    defaultValue: false,
    isExperimental: true,
    targetUsers: 'internal',
  },
  aiMotivation: {
    name: 'ai-motivation',
    description: 'Enables AI-powered motivational messages',
    defaultValue: false,
    isExperimental: true,
    targetUsers: 'internal',
  },
} as const;

/**
 * Type-safe feature flag names
 */
export type FeatureFlagName = keyof typeof featureFlags;

/**
 * Default values for all feature flags
 */
export const defaultFlags: Record<FeatureFlagName, boolean> = Object.entries(
  featureFlags
).reduce((acc, [key, value]) => ({
  ...acc,
  [key]: value.defaultValue,
}), {} as Record<FeatureFlagName, boolean>);

/**
 * Get a feature flag by name
 */
export function getFeatureFlag(name: FeatureFlagName): FeatureFlag {
  const flag = featureFlags[name];
  if (!flag) {
    throw new Error(`Unknown feature flag: ${name}`);
  }
  return flag;
}
