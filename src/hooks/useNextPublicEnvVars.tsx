'use client';

import { useState, useEffect, useMemo } from 'react';

/**
 * A hook to safely check for required environment variables in Next.js
 * - Only runs once on initial mount
 * - Safely handles client/server rendering 
 * - Returns dynamic status without causing render loops
 */
export function useNextPublicEnvVars(requiredVars: string[]) {
  // Store missing vars state
  const [missingVars, setMissingVars] = useState<string[]>([]);
  const [checksComplete, setChecksComplete] = useState<boolean>(false);
  
  // Run checks only once on mount
  useEffect(() => {
    // Skip during SSR
    if (typeof window === 'undefined') return;
    
    // Check which vars are missing from process.env
    const missing = requiredVars.filter(varName => {
      const value = process.env[varName];
      return !value || value === 'undefined' || value === '';
    });
    
    // Update state only once
    setMissingVars(missing);
    setChecksComplete(true);
    
    // Log missing vars (only once)
    if (missing.length > 0 && process.env.NODE_ENV !== 'test') {
      console.warn(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }, []); // Empty dependency array ensures this only runs once
  
  // Derived values (memoized to prevent recalculation)
  const isValid = useMemo(() => 
    checksComplete && missingVars.length === 0, 
    [checksComplete, missingVars.length]
  );
  
  return {
    isValid,
    missingVars,
    checksComplete
  };
}
