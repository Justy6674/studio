'use client';

import { useState, useEffect } from 'react';

/**
 * Hook that listens for changes to a media query
 * @param query The media query to listen for
 * @returns Whether the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    // Default to false for SSR
    if (typeof window === 'undefined') {
      return;
    }
    
    const media = window.matchMedia(query);
    setMatches(media.matches);
    
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };
    
    // Add listener and check initial state
    media.addEventListener('change', listener);
    
    // Cleanup: remove listener
    return () => {
      media.removeEventListener('change', listener);
    };
  }, [query]);
  
  return matches;
}
