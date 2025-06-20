// Design System Entry Point
// Re-exports all design tokens and utilities

export * from './colors';
export * from './typography';
export * from './spacing';

// Theme configuration
export const theme = {
  colors: {
    ...require('./colors').colors,
  },
  typography: {
    ...require('./typography'),
  },
  spacing: {
    ...require('./spacing').spacing,
  },
  borderRadius: {
    ...require('./spacing').borderRadius,
  },
  borderWidth: {
    ...require('./spacing').borderWidth,
  },
  opacity: {
    ...require('./spacing').opacity,
  },
  // Add other theme properties as needed
} as const;

// Type exports
export type { ColorPalette, ColorShade } from './colors';
export type { FontSize, FontWeight, LetterSpacing, LineHeight } from './typography';
export type { Spacing, BorderRadius, BorderWidth, Opacity } from './spacing';

// Default theme type
export type Theme = typeof theme;
