'use client';

import { useState, useEffect } from 'react';

// Hook to integrate localStorage with React state
export function useLocalStorage<T>(key: string, initialValue: T) {
  // Create state to store data
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Initialize stored value from localStorage
  useEffect(() => {
    try {
      // Check if running in browser context
      if (typeof window !== 'undefined') {
        const item = window.localStorage.getItem(key);
        // Parse stored json or return initialValue if nothing is stored
        setStoredValue(item ? JSON.parse(item) : initialValue);
      }
    } catch (error) {
      // If error, use the initialValue
      console.error(`Error reading localStorage key "${key}":`, error);
      setStoredValue(initialValue);
    }
  }, [key, initialValue]);

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      
      // Save to state
      setStoredValue(valueToStore);
      
      // Save to localStorage (only in browser context)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}
