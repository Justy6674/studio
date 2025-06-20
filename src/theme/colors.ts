// Color palette for Water4WeightLoss
// Follows WCAG 2.1 AA contrast guidelines for accessibility

export const colors = {
  // Primary brand color - teal (darkened for better contrast)
  primary: {
    50: '#e0f7fa',
    100: '#b2ebf2',
    200: '#80deea',
    300: '#4dd0e1',
    400: '#00bcd4',
    500: '#0097a7', // Darker teal for better contrast
    600: '#00838f',
    700: '#006064',
    800: '#004d40',
    900: '#00251a',
  },
  
  // Secondary color - blue
  secondary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Main secondary color
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  
  // Neutral colors
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  
  // Feedback colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
  },
  error: {
    50: '#ffebee',
    100: '#ffcdd2',
    400: '#ef5350',
    500: '#f44336', // More standard red for errors
    600: '#e53935',
    700: '#d32f2f',
  },
  
  // Background colors
  background: {
    light: '#ffffff',
    dark: '#0f172a',
  },
  
  // Text colors - updated to meet WCAG 2.1 AA
  text: {
    primary: '#000000',    // Pure black for best contrast
    secondary: '#1a237e',  // Deep blue for secondary text
    disabled: '#5c6bc0',   // More visible for disabled state
    inverse: '#ffffff',    // For dark backgrounds
  },
} as const;

// Type exports for better type safety
export type ColorPalette = keyof typeof colors;

export type ColorShade = 
  | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 
  | '50' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';

type ColorValue = {
  [key in ColorShade]?: string;
} & {
  [key: string]: any; // For any additional properties that might exist
};

// Utility function to get color with type safety
export function getColor(
  color: ColorPalette,
  shade: ColorShade = 500
): string {
  const colorObj = colors[color] as ColorValue;
  const shadeKey = typeof shade === 'number' ? shade.toString() as keyof typeof colorObj : shade;
  return colorObj[shadeKey] || colorObj[500] || '#000000';
}
