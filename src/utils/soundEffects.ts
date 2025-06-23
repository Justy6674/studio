export type ToneType = 'kind' | 'strict' | 'funny' | 'kick' | 'Default';

// Map of tone types to sound file paths
const toneToSoundMap: Record<ToneType, string> = {
  kind: '/sounds/kind-chime.mp3',
  strict: '/sounds/strict-alert.mp3',
  funny: '/sounds/funny-pop.mp3',
  kick: '/sounds/kick-boost.mp3',
  Default: '/sounds/gentle-notification.mp3'
};

/**
 * Play a sound effect based on the given tone
 * @param tone The tone to play a sound for
 * @param volume Volume level between 0 and 1 (default: 0.5)
 * @returns Promise that resolves when the sound is loaded (not necessarily played)
 */
export const playToneSound = async (tone: ToneType, volume: number = 0.5): Promise<void> => {
  // If window or Audio API is not available (SSR), silently return
  if (typeof window === 'undefined' || typeof Audio === 'undefined') {
    return;
  }

  try {
    const soundPath = toneToSoundMap[tone] || toneToSoundMap.Default;
    const audio = new Audio(soundPath);
    
    // Set volume
    audio.volume = Math.max(0, Math.min(1, volume));
    
    // Load the audio
    await audio.load();
    
    // Play the sound
    await audio.play();
  } catch (error) {
    // If sound fails to play (e.g., file not found or autoplay blocked),
    // silently handle the error as this is a non-critical feature
    console.error('Failed to play sound effect:', error);
  }
};

/**
 * Preloads all sound effects for faster playback later
 * Call this early in the app initialization if possible
 */
export const preloadSoundEffects = (): void => {
  // Skip if not in browser
  if (typeof window === 'undefined' || typeof Audio === 'undefined') {
    return;
  }
  
  // Create audio elements for each sound but don't play them
  Object.values(toneToSoundMap).forEach(path => {
    try {
      const audio = new Audio();
      audio.src = path;
      audio.preload = 'auto';
      // Don't need to attach the element to DOM for preloading
    } catch (error) {
      console.error('Failed to preload sound:', path, error);
    }
  });
};
