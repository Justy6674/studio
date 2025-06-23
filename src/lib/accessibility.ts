/**
 * Accessibility utility functions for ensuring color contrast compliance
 */

/**
 * Calculate relative luminance of a color in sRGB space
 * Formula from WCAG 2.0: https://www.w3.org/TR/WCAG20/#relativeluminancedef
 */
export function getLuminance(hexColor: string): number {
  // Remove # if present
  const hex = hexColor.replace('#', '');
  
  // Convert hex to rgb
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  // Calculate luminance
  const R = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const G = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const B = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
  
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Calculate contrast ratio between two colors
 * Formula from WCAG 2.0: https://www.w3.org/TR/WCAG20/#contrast-ratiodef
 */
export function getContrastRatio(color1: string, color2: string): number {
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  
  // Return contrast ratio (lighter color / darker color)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA standards
 * - 4.5:1 for normal text
 * - 3:1 for large text (18pt+) or bold text (14pt+)
 */
export function meetsWCAGAA(color1: string, color2: string, isLargeText = false): boolean {
  const ratio = getContrastRatio(color1, color2);
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Check if contrast ratio meets WCAG AAA standards
 * - 7:1 for normal text
 * - 4.5:1 for large text (18pt+) or bold text (14pt+)
 */
export function meetsWCAGAAA(color1: string, color2: string, isLargeText = false): boolean {
  const ratio = getContrastRatio(color1, color2);
  return isLargeText ? ratio >= 4.5 : ratio >= 7;
}

/**
 * Common app colors for accessibility checks
 */
export const appColors = {
  background: '#ffffff',
  foreground: '#09090b',
  primary: '#5271ff',
  primaryForeground: '#ffffff',
  muted: '#f1f5f9',
  mutedForeground: '#64748b', 
  accent: '#f8fafc',
  accentForeground: '#0f172a',
  destructive: '#ef4444',
  destructiveForeground: '#ffffff',
  success: '#22c55e',
  successForeground: '#ffffff',
  warning: '#f59e0b',
  warningForeground: '#ffffff',
};

/**
 * Verify if app colors meet WCAG AA contrast standards
 * Returns an array of issues found
 */
export function checkAppColorContrast(): { 
  element: string; 
  background: string; 
  foreground: string; 
  ratio: number; 
  passes: boolean; 
  required: number;
}[] {
  const issues = [];
  
  // Check text on background
  const textBgRatio = getContrastRatio(appColors.foreground, appColors.background);
  issues.push({
    element: 'Text on Background',
    background: appColors.background,
    foreground: appColors.foreground,
    ratio: textBgRatio,
    passes: textBgRatio >= 4.5,
    required: 4.5
  });
  
  // Check muted text on background
  const mutedTextBgRatio = getContrastRatio(appColors.mutedForeground, appColors.background);
  issues.push({
    element: 'Muted Text on Background',
    background: appColors.background,
    foreground: appColors.mutedForeground,
    ratio: mutedTextBgRatio,
    passes: mutedTextBgRatio >= 4.5,
    required: 4.5
  });
  
  // Check primary button
  const primaryButtonRatio = getContrastRatio(appColors.primaryForeground, appColors.primary);
  issues.push({
    element: 'Primary Button Text',
    background: appColors.primary,
    foreground: appColors.primaryForeground,
    ratio: primaryButtonRatio,
    passes: primaryButtonRatio >= 4.5,
    required: 4.5
  });
  
  // Check destructive button
  const destructiveButtonRatio = getContrastRatio(appColors.destructiveForeground, appColors.destructive);
  issues.push({
    element: 'Destructive Button Text',
    background: appColors.destructive,
    foreground: appColors.destructiveForeground,
    ratio: destructiveButtonRatio,
    passes: destructiveButtonRatio >= 4.5,
    required: 4.5
  });
  
  // Check accent
  const accentRatio = getContrastRatio(appColors.accentForeground, appColors.accent);
  issues.push({
    element: 'Accent Text',
    background: appColors.accent,
    foreground: appColors.accentForeground,
    ratio: accentRatio,
    passes: accentRatio >= 4.5,
    required: 4.5
  });
  
  return issues;
}

/**
 * Suggest improved colors for accessibility
 */
export function suggestAccessibleColors() {
  const issues = checkAppColorContrast().filter(issue => !issue.passes);
  
  // If no issues, return the original colors
  if (issues.length === 0) {
    return appColors;
  }
  
  // Create a copy of app colors to modify
  const improvedColors = { ...appColors };
  
  // For each failing color pair, adjust the foreground color to improve contrast
  issues.forEach(issue => {
    // Determine which color to adjust (usually foreground)
    // This is a simplified approach - in real situations, you might
    // want to use more sophisticated color adjustment algorithms
    if (issue.element === 'Muted Text on Background') {
      // Make muted text darker for better contrast
      improvedColors.mutedForeground = '#525252'; // Darker gray
    }
    
    if (issue.element === 'Accent Text' && !issue.passes) {
      // Darken accent foreground if needed
      improvedColors.accentForeground = '#020817'; // Darker shade
    }
  });
  
  return improvedColors;
}

/**
 * A11y helper component props
 */
export interface A11yProps {
  id?: string;
  role?: string;
  tabIndex?: number;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-hidden'?: boolean;
  'aria-live'?: 'assertive' | 'polite' | 'off';
  'aria-atomic'?: boolean;
}
