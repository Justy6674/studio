'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { Theme } from '@/theme';
import { theme } from '@/theme';

// Create a context for the theme
const ThemeContext = createContext<Theme | undefined>(undefined);

// Type for the theme provider props
type ThemeProviderProps = {
  children: React.ReactNode;
  customTheme?: Partial<Theme>;
};

/**
 * ThemeProvider component that provides the theme context to all child components.
 * Can be used to override the default theme with a custom theme.
 */
export function ThemeProvider({ children, customTheme }: ThemeProviderProps) {
  // Merge the default theme with any custom theme overrides
  const value = useMemo(() => ({
    ...theme,
    ...customTheme,
    colors: {
      ...theme.colors,
      ...customTheme?.colors,
    },
    typography: {
      ...theme.typography,
      ...customTheme?.typography,
    },
    spacing: {
      ...theme.spacing,
      ...customTheme?.spacing,
    },
    borderRadius: {
      ...theme.borderRadius,
      ...customTheme?.borderRadius,
    },
    borderWidth: {
      ...theme.borderWidth,
      ...customTheme?.borderWidth,
    },
    opacity: {
      ...theme.opacity,
      ...customTheme?.opacity,
    },
  }), [customTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to use the theme context
 * @returns The current theme object
 * @throws Error if used outside of a ThemeProvider
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * A higher-order component that provides the theme context
 * @param Component - The component to wrap with the theme context
 * @returns A new component with the theme context
 */
export function withTheme<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  const WithTheme: React.FC<P> = (props) => (
    <ThemeProvider>
      <Component {...props} />
    </ThemeProvider>
  );
  
  // Set a display name for the HOC
  const displayName = Component.displayName || Component.name || 'Component';
  WithTheme.displayName = `withTheme(${displayName})`;
  
  return WithTheme;
}

// Export the ThemeContext for advanced use cases
export { ThemeContext };
