'use client';

import { useLocalStorage } from './useLocalStorage';

type MotivationPreferences = {
  hiddenUntil: number | null; // Timestamp when to show messages again (null = show always)
  favorites: string[]; // Array of favorite motivation messages
  soundEnabled: boolean; // Whether sound effects are enabled
};

export function useMotivationPreferences() {
  const [preferences, setPreferences] = useLocalStorage<MotivationPreferences>(
    'motivation-preferences',
    {
      hiddenUntil: null,
      favorites: [],
      soundEnabled: false, // Default to sounds disabled
    }
  );

  // Check if motivational messages are hidden for today
  const isHiddenToday = (): boolean => {
    if (!preferences.hiddenUntil) return false;
    
    // Get current datetime and reset-time (next day at midnight)
    const now = Date.now();
    return now < preferences.hiddenUntil;
  };

  // Hide motivational messages until the next day (midnight)
  const hideForToday = () => {
    // Calculate midnight of the next day
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    setPreferences({
      ...preferences,
      hiddenUntil: tomorrow.getTime(),
    });
  };

  // Add a message to favorites
  const addToFavorites = (message: string) => {
    if (!preferences.favorites.includes(message)) {
      setPreferences({
        ...preferences,
        favorites: [...preferences.favorites, message],
      });
    }
  };

  // Remove a message from favorites
  const removeFromFavorites = (message: string) => {
    setPreferences({
      ...preferences,
      favorites: preferences.favorites.filter(msg => msg !== message),
    });
  };

  // Reset all preferences
  const resetPreferences = () => {
    setPreferences({
      hiddenUntil: null,
      favorites: [],
      soundEnabled: false,
    });
  };
  
  // Toggle sound effects on/off
  const toggleSound = () => {
    setPreferences({
      ...preferences,
      soundEnabled: !preferences.soundEnabled,
    });
  };

  return {
    isHiddenToday,
    hideForToday,
    isFavorite: (message: string) => preferences.favorites.includes(message),
    addToFavorites,
    removeFromFavorites,
    favorites: preferences.favorites,
    soundEnabled: preferences.soundEnabled,
    toggleSound,
    resetPreferences,
  };
}
