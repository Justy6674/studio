import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { FeatureFlagProvider, useFeatureFlag } from '../FeatureFlagProvider';

// Mock the UnleashProvider since we don't want to test its internals
vi.mock('@unleash/nextjs', () => ({
  UnleashProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-unleash-provider">{children}</div>
  ),
}));

// Test component that uses the useFeatureFlag hook
const TestComponent = ({ flagName }: { flagName: string }) => {
  const { isEnabled, isLoading, error } = useFeatureFlag(flagName as string);
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>Flag is {isEnabled ? 'enabled' : 'disabled'}</div>;
};

describe('FeatureFlagProvider', () => {
  const originalEnv = process.env;
  
  beforeEach(() => {
    // Reset mocks and environment variables before each test
    vi.resetModules();
    process.env = { ...originalEnv };
  });
  
  afterEach(() => {
    // Restore original environment variables
    process.env = originalEnv;
  });
  
  it('should render children when configured correctly', () => {
    render(
      <FeatureFlagProvider 
        unleashConfig={{
          url: 'https://example.com/api',
          clientKey: 'test-key',
          appName: 'test-app',
        }}
      >
        <div data-testid="test-child">Test</div>
      </FeatureFlagProvider>
    );
    
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
  });
  
  it('should handle missing environment variables in development', () => {
    // Suppress console.warn for this test
    const consoleWarn = console.warn;
    console.warn = vi.fn();
    
    render(
      <FeatureFlagProvider 
        unleashConfig={{
          url: '',
          clientKey: '',
          appName: '',
        }}
      >
        <TestComponent flagName="newNavigation" />
      </FeatureFlagProvider>
    );
    
    // Should still render without throwing
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    
    // Restore console.warn
    console.warn = consoleWarn;
  });
  
  it('should throw an error when useFeatureFlag is used outside provider', () => {
    // Suppress the expected error log for this test
    const consoleError = console.error;
    console.error = vi.fn();
    
    // Render without the provider to trigger the error
    expect(() => render(<TestComponent flagName="newNavigation" />)).toThrow(
      'useFeatureFlag must be used within a FeatureFlagProvider'
    );
    
    // Restore console.error
    console.error = consoleError;
  });
});

describe('useFeatureFlag', () => {
  it('should return the correct flag status', async () => {
    // Mock the Unleash client to return a specific flag value
    const mockGetVariant = vi.fn().mockReturnValue({ enabled: true });
    
    vi.mock('@unleash/nextjs', () => ({
      useUnleashContext: () => ({}),
      useFlag: (flagName: string) => flagName === 'new-navigation',
      useVariant: () => mockGetVariant(),
    }));
    
    const TestComponent = () => {
      const { isEnabled } = useFeatureFlag('newNavigation');
      return <div>{isEnabled ? 'Enabled' : 'Disabled'}</div>;
    };
    
    render(
      <FeatureFlagProvider 
        unleashConfig={{
          url: 'https://example.com/api',
          clientKey: 'test-key',
          appName: 'test-app',
        }}
      >
        <TestComponent />
      </FeatureFlagProvider>
    );
    
    // The flag should be enabled based on our mock
    await waitFor(() => {
      expect(screen.getByText('Enabled')).toBeInTheDocument();
    });
  });
});
