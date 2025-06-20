/// <reference types="@types/jest" />

import { colors } from './colors';

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeGreaterThanOrEqual(arg: number): R;
    }
  }
}

// WCAG 2.1 AA requires a contrast ratio of at least 4.5:1 for normal text and 3:1 for large text
describe('Color Accessibility', () => {
  // Test primary color contrast against background
  test('primary colors have sufficient contrast on light background', () => {
    // Primary text on light background should have at least 4.5:1 contrast
    expect(checkContrast(colors.text.primary, colors.background.light)).toBeGreaterThanOrEqual(4.5);
    
    // Primary brand color (500) on light background should have good contrast
    expect(checkContrast(colors.primary[500], colors.background.light)).toBeGreaterThanOrEqual(3);
  });

  test('error and success colors have sufficient contrast', () => {
    // Error text should be clearly visible on light background
    expect(checkContrast(colors.error[500], colors.background.light)).toBeGreaterThanOrEqual(4.5);
    
    // Success text should be clearly visible on light background
    expect(checkContrast(colors.success[500], colors.background.light)).toBeGreaterThanOrEqual(4.5);
  });

  test('text colors have sufficient contrast', () => {
    // Primary text should have good contrast on light background
    expect(checkContrast(colors.text.primary, colors.background.light)).toBeGreaterThanOrEqual(4.5);
    
    // Secondary text should also meet minimum contrast
    expect(checkContrast(colors.text.secondary, colors.background.light)).toBeGreaterThanOrEqual(4.5);
  });
});

// Helper function to calculate relative luminance
function getLuminance(hex: string): number {
  // Convert hex to RGB
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  // Apply gamma correction
  const [r1, g1, b1] = [r, g, b].map(c => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  // Calculate relative luminance
  return 0.2126 * r1 + 0.7152 * g1 + 0.0722 * b1;
}

// Helper function to calculate contrast ratio
function checkContrast(color1: string, color2: string): number {
  // Remove # from hex if present
  const c1 = color1.startsWith('#') ? color1.slice(1) : color1;
  const c2 = color2.startsWith('#') ? color2.slice(1) : color2;

  const l1 = getLuminance(c1) + 0.05;
  const l2 = getLuminance(c2) + 0.05;
  
  // Return contrast ratio (lightest / darkest)
  return l1 > l2 ? l1 / l2 : l2 / l1;
}
