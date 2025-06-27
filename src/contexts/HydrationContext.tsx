'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, Timestamp, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Helper type to handle both Date and Firestore Timestamp
type MaybeTimestamp = Date | Timestamp;

interface HydrationRecord {
  amount: number;
  timestamp: MaybeTimestamp;
  // Add a method to safely get the date
  getDate: () => Date;
}

type DailyHydration = {
  date: string; // YYYY-MM-DD
  total: number;
  goal: number;
  logs: HydrationRecord[];
  lastUpdated: Date;
};

type HydrationContextType = {
  dailyHydration: DailyHydration | null;
  hydrationGoal: number;
  hydrationPercentage: number;
  logHydration: (amount: number) => Promise<void>;
  updateHydrationGoal: (newGoal: number) => Promise<void>;
  isLoading: boolean;
  error: string | null;
};

const HydrationContext = createContext<HydrationContextType | undefined>(undefined);

export function HydrationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [dailyHydration, setDailyHydration] = useState<DailyHydration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hydrationGoal, setHydrationGoal] = useState(3000); // Default 3L goal
  
  // Track component mount status to prevent state updates after unmount
  const isMounted = useRef<boolean>(true);

  // Calculate hydration percentage - memoized to prevent unnecessary re-renders
  const hydrationPercentage = useMemo(() => {
    return dailyHydration
      ? Math.min(Math.round((dailyHydration.total / hydrationGoal) * 100), 100)
      : 0;
  }, [dailyHydration, hydrationGoal]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const getCurrentDateString = useCallback(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }, []);

  const toDate = useCallback((timestamp: MaybeTimestamp): Date => {
    return timestamp instanceof Date ? timestamp : timestamp?.toDate?.() || new Date();
  }, []);

  const createHydrationRecord = useCallback((amount: number, timestamp: MaybeTimestamp = new Date()): HydrationRecord => ({
    amount,
    timestamp,
    getDate: () => toDate(timestamp)
  }), [toDate]);

  const loadHydrationData = useCallback(async () => {
    if (!user) return;
    if (!isMounted.current) return;
    
    // Skip if SSR
    if (typeof window === 'undefined') return;

    setIsLoading(true);
    setError(null);
    
    try {
      const { httpsCallable } = await import('firebase/functions');
      const { functions } = await import('@/lib/firebase');
      
      const fetchHydrationLogsFunction = httpsCallable(functions, 'fetchHydrationLogs');
      console.debug('🔥 Firebase Function Call - fetchHydrationLogs (Context)');
      
      // Use Firebase Functions SDK instead of raw HTTP
      const result = await fetchHydrationLogsFunction({});
      console.debug('✅ Firebase Function Response - fetchHydrationLogs (Context):', result.data);
      
      const data = result.data as any;
      const logs = (data.logs || []).map((log: any) => 
        createHydrationRecord(log.amount, new Date(log.timestamp))
      );
      
      // Skip state updates if component unmounted
      if (!isMounted.current) return;
      
      const today = getCurrentDateString();
      setDailyHydration({
        date: today,
        total: data.total || 0,
        goal: data.goal || 3000,
        logs,
        lastUpdated: new Date()
      });
      setHydrationGoal(data.goal || 3000);
    } catch (err) {
      console.error('Error loading hydration data:', err);
      setError('Failed to load hydration data');
    } finally {
      setIsLoading(false);
    }
  }, [user, getCurrentDateString, createHydrationRecord]);

  useEffect(() => {
    // Skip if SSR
    if (typeof window === 'undefined') return;
    loadHydrationData().catch(err => {
      console.error("Failed to load hydration data from useEffect:", err);
      setError('An unexpected error occurred while loading data.');
    });
  }, [user, loadHydrationData]);

  const logHydration = useCallback(async (amount: number) => {
    if (!user) return;
    if (!isMounted.current) return;
    
    try {
      const { httpsCallable } = await import('firebase/functions');
      const { functions } = await import('@/lib/firebase');
      
      const logHydrationFunction = httpsCallable(functions, 'logHydration');
      console.debug('🔥 Firebase Function Call - logHydration (Context):', { amount });
      
      // Use Firebase Functions SDK with proper authentication
      const result = await logHydrationFunction({ amount });
      console.debug('✅ Firebase Function Response - logHydration (Context):', result.data);
      
      // Skip state updates if component unmounted
      if (!isMounted.current) return;
      
      // Update local state with the response from Firebase Function
      const record = createHydrationRecord(amount);
      const newTotal = (dailyHydration?.total || 0) + amount;
      
      setDailyHydration(prev => {
        if (!prev) return prev;
        
        const newLogs = [...prev.logs, record];
        
        return {
          ...prev,
          total: newTotal,
          logs: newLogs,
          lastUpdated: new Date()
        };
      });
    } catch (error) {
      // Skip console logging in production to prevent render churn
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to log hydration:', error);
      }
      
      // Skip state updates if component unmounted
      if (!isMounted.current) return;
      setError('Failed to log hydration');
    }
  }, [user, dailyHydration, createHydrationRecord]);

  const updateHydrationGoal = useCallback(async (newGoal: number) => {
    if (!user || !dailyHydration) return;
    if (!isMounted.current) return;
    
    try {
      const today = getCurrentDateString();
      const docRef = doc(db, 'users', user.uid, 'hydration', today);
      
      // Update Firestore
      await updateDoc(docRef, { 
        goal: newGoal,
        lastUpdated: serverTimestamp()
      });
      
      // Skip state updates if component unmounted
      if (!isMounted.current) return;
      
      // Update local state
      setDailyHydration(prev => prev ? {
        ...prev,
        goal: newGoal,
        lastUpdated: new Date()
      } : null);
      setHydrationGoal(newGoal);
    } catch (err) {
      console.error('Error updating hydration goal:', err);
      setError('Failed to update hydration goal');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user, dailyHydration, getCurrentDateString]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => {
    return {
      dailyHydration,
      hydrationGoal,
      hydrationPercentage,
      logHydration,
      updateHydrationGoal,
      isLoading,
      error
    };
  }, [
    dailyHydration,
    hydrationGoal,
    hydrationPercentage,
    logHydration,
    updateHydrationGoal,
    isLoading,
    error
  ]);

  return <HydrationContext.Provider value={value}>{children}</HydrationContext.Provider>;
}

export const useHydration = () => {
  const context = useContext(HydrationContext);
  if (context === undefined) {
    throw new Error('useHydration must be used within a HydrationProvider');
  }
  return context;
};
