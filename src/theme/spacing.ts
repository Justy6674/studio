// Spacing system for Water4WeightLoss
// Uses a 4px base unit for consistent spacing

export const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',    // 20px
  6: '1.5rem',     // 24px
  7: '1.75rem',    // 28px
  8: '2rem',       // 32px
  9: '2.25rem',   // 36px
  10: '2.5rem',   // 40px
  11: '2.75rem',  // 44px
  12: '3rem',     // 48px
  14: '3.5rem',   // 56px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  28: '7rem',     // 112px
  32: '8rem',     // 128px
  36: '9rem',     // 144px
  40: '10rem',    // 160px
  44: '11rem',    // 176px
  48: '12rem',    // 192px
  52: '13rem',    // 208px
  56: '14rem',    // 224px
  60: '15rem',    // 240px
  64: '16rem',    // 256px
  72: '18rem',    // 288px
  80: '20rem',    // 320px
  96: '24rem',    // 384px
} as const;

export const borderRadius = {
  none: '0px',
  sm: '0.125rem',  // 2px
  DEFAULT: '0.25rem',  // 4px
  md: '0.375rem', // 6px
  lg: '0.5rem',   // 8px
  xl: '0.75rem',  // 12px
  '2xl': '1rem',  // 16px
  '3xl': '1.5rem', // 24px
  full: '9999px',
} as const;

export const borderWidth = {
  DEFAULT: '1px',
  0: '0px',
  2: '2px',
  4: '4px',
  8: '8px',
} as const;

export const opacity = {
  0: '0',
  5: '0.05',
  10: '0.1',
  20: '0.2',
  25: '0.25',
  30: '0.3',
  40: '0.4',
  50: '0.5',
  60: '0.6',
  70: '0.7',
  75: '0.75',
  80: '0.8',
  90: '0.9',
  95: '0.95',
  100: '1',
} as const;

// Type exports
export type Spacing = keyof typeof spacing;
export type BorderRadius = keyof typeof borderRadius;
export type BorderWidth = keyof typeof borderWidth;
export type Opacity = keyof typeof opacity;

// Utility functions
export function getSpacing(size: Spacing): string {
  return spacing[size];
}

export function getBorderRadius(size: BorderRadius = 'DEFAULT'): string {
  return borderRadius[size];
}

export function getBorderWidth(width: BorderWidth = 'DEFAULT'): string {
  return borderWidth[width];
}

export function getOpacity(level: Opacity = 100): string {
  return opacity[level];
}
