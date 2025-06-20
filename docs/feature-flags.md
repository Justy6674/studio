# Feature Flags Guide

## Overview
Feature flags allow us to safely deploy and test new features by enabling/disabling them without code changes. This document explains how to use the feature flag system in the Water4WeightLoss application.

## Available Feature Flags

| Name | Description | Default | Status |
|------|-------------|---------|--------|
| `newNavigation` | Enables the new bottom navigation bar | `false` | Experimental |
| `fabEnabled` | Enables the floating action button | `false` | Experimental |
| `aiMotivation` | Enables AI-powered motivational messages | `false` | Experimental |

## Basic Usage

### Checking a Feature Flag

```typescript
import { useFeatureFlag } from '@/components/providers/FeatureFlagProvider';

function MyComponent() {
  const { isEnabled, isLoading, error } = useFeatureFlag('newNavigation');

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return isEnabled ? <NewNavigation /> : <OldNavigation />;
}
```

### Using the FeatureFlag Component

For conditional rendering, you can use the `FeatureFlag` component:

```typescript
import { FeatureFlag } from '@/components/providers/FeatureFlagProvider';

function App() {
  return (
    <FeatureFlag flag="newNavigation" fallback={<OldNavigation />}>
      <NewNavigation />
    </FeatureFlag>
  );
}
```

## Adding a New Feature Flag

1. Add the flag to `src/lib/feature-flags.ts`:

```typescript
export const featureFlags = {
  // ... existing flags
  myNewFeature: {
    name: 'my-new-feature',
    description: 'Enables the amazing new feature',
    defaultValue: false,
    isExperimental: true,
    targetUsers: 'internal', // or 'beta', 'all'
  },
} as const;
```

2. Use the flag in your component following the examples above.

## Best Practices

1. **Keep flags short-lived**: Remove flags once the feature is stable.
2. **Document changes**: Update this guide when adding/removing flags.
3. **Test both states**: Ensure your feature works when the flag is on/off.
4. **Consider performance**: Don't overuse feature flags in performance-critical paths.

## Testing

### Unit Testing

```typescript
import { render, screen } from '@testing-library/react';
import { useFeatureFlag } from '@/components/providers/FeatureFlagProvider';

// Mock the hook
vi.mock('@/components/providers/FeatureFlagProvider', () => ({
  useFeatureFlag: vi.fn(),
}));

test('shows new feature when enabled', () => {
  // Mock the hook to return enabled
  (useFeatureFlag as jest.Mock).mockReturnValue({
    isEnabled: true,
    isLoading: false,
    error: null,
  });

  render(<MyComponent />);
  expect(screen.getByText('New Feature')).toBeInTheDocument();
});
```

## Environment Variables

See the main [README](../README.md#-environment-variables) for required environment variables.

## Troubleshooting

- **Flag not working?**
  - Check the flag name matches exactly
  - Verify the Unleash server is running
  - Check browser console for errors

- **Loading state stuck?**
  - Verify network connectivity
  - Check Unleash server logs
  - Ensure environment variables are set correctly

## Related Components

- `FeatureFlagProvider` - The main provider component
- `useFeatureFlag` - Hook to check flag status
- `FeatureFlag` - Component for conditional rendering
