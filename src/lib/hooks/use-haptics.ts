'use client';

type HapticFeedbackType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

export function useHaptics() {
  const isHapticsSupported = 
    typeof window !== 'undefined' && 
    'navigator' in window && 
    'vibrate' in navigator;

  const triggerHaptic = (type: HapticFeedbackType = 'medium') => {
    if (!isHapticsSupported) return;

    // Vibration patterns in milliseconds
    const patterns = {
      light: [15],
      medium: [30],
      heavy: [50],
      success: [30, 30, 30],
      warning: [40, 60, 40],
      error: [60, 40, 60, 40, 60]
    };

    try {
      navigator.vibrate(patterns[type] || patterns.medium);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  };

  return { triggerHaptic, isHapticsSupported };
}
