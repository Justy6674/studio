import { describe, it, expect, vi, beforeEach } from 'vitest';
import { featureFlags, getFeatureFlag, defaultFlags } from '../feature-flags';

describe('Feature Flags', () => {
  beforeEach(() => {
    // Reset mocks and environment variables before each test
    vi.resetModules();
    process.env = { ...process.env };
  });

  describe('featureFlags', () => {
    it('should have the correct structure for each flag', () => {
      Object.values(featureFlags).forEach((flag) => {
        expect(flag).toHaveProperty('name');
        expect(flag).toHaveProperty('description');
        expect(flag).toHaveProperty('defaultValue');
        expect(typeof flag.name).toBe('string');
        expect(typeof flag.description).toBe('string');
        expect(typeof flag.defaultValue).toBe('boolean');
      });
    });

    it('should have consistent flag names between keys and name properties', () => {
      Object.entries(featureFlags).forEach(([key, flag]) => {
        expect(flag.name).toBe(key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase());
      });
    });
  });

  describe('defaultFlags', () => {
    it('should have the same keys as featureFlags', () => {
      const featureFlagKeys = Object.keys(featureFlags);
      const defaultFlagKeys = Object.keys(defaultFlags);
      
      expect(defaultFlagKeys).toEqual(featureFlagKeys);
    });

    it('should have default values matching feature flag defaults', () => {
      Object.entries(featureFlags).forEach(([key, flag]) => {
        expect(defaultFlags[key as keyof typeof defaultFlags]).toBe(flag.defaultValue);
      });
    });
  });

  describe('getFeatureFlag', () => {
    it('should return the correct feature flag', () => {
      const flag = getFeatureFlag('newNavigation');
      expect(flag).toBeDefined();
      expect(flag.name).toBe('new-navigation');
    });

    it('should throw an error for unknown feature flags', () => {
      expect(() => getFeatureFlag('unknownFlag' as any)).toThrow('Unknown feature flag: unknownFlag');
    });
  });
});
