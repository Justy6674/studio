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
  drinkType?: string;
  drinkName?: string;
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
  logHydration: (amount: number, drinkType?: string, drinkName?: string) => Promise<void>;
  updateHydrationGoal: (newGoal: number) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  pendingUpdates: boolean;
  retryPendingLogs: () => Promise<void>;
};

const HydrationContext = createContext<HydrationContextType | undefined>(undefined);

export function HydrationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [dailyHydration, setDailyHydration] = useState<DailyHydration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hydrationGoal, setHydrationGoal] = useState(3000); // Default 3L goal
  const [pendingUpdates, setPendingUpdates] = useState(false);
  const [pendingLogs, setPendingLogs] = useState<{amount: number, drinkType?: string, drinkName?: string, timestamp: Date}[]>([]);
  
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

  const createHydrationRecord = useCallback((amount: number, timestamp: MaybeTimestamp = new Date(), drinkType?: string, drinkName?: string): HydrationRecord => ({
    amount,
    timestamp,
    drinkType,
    drinkName,
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
      const today = getCurrentDateString();
      const docRef = doc(db, 'users', user.uid, 'hydration', today);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as Omit<DailyHydration, 'date'>;
        const logs = (data.logs || []).map((log: unknown) => {
          if (typeof log === 'object' && log !== null && 'amount' in log && 'timestamp' in log) {
            // @ts-expect-error: TypeScript can't infer the shape, but we checked keys
            return createHydrationRecord(log.amount, log.timestamp);
          }
          return null;
        }).filter(Boolean) as HydrationRecord[];
        
        // Skip state updates if component unmounted
        if (!isMounted.current) return;
        
        setDailyHydration({
          ...data,
          date: today,
          logs,
          lastUpdated: toDate(data.lastUpdated)
        });
        setHydrationGoal(data.goal || 3000);
      } else {
        // Create new daily hydration record
        const newHydration: DailyHydration = {
          date: today,
          total: 0,
          goal: 3000,
          logs: [],
          lastUpdated: new Date()
        };
        await setDoc(docRef, newHydration);
        
        // Skip state updates if component unmounted
        if (!isMounted.current) return;
        
        setDailyHydration(newHydration);
        setHydrationGoal(3000);
      }
    } catch (err) {
      console.error('Error loading hydration data:', err);
      setError('Failed to load hydration data');
    } finally {
      setIsLoading(false);
    }
  }, [user, getCurrentDateString, createHydrationRecord, toDate]);

  useEffect(() => {
    // Skip if SSR
    if (typeof window === 'undefined') return;
    loadHydrationData().catch(err => {
      console.error("Failed to load hydration data from useEffect:", err);
      setError('An unexpected error occurred while loading data.');
    });
  }, [user, loadHydrationData]);

  const logHydration = useCallback(async (amount: number, drinkType?: string, drinkName?: string) => {
    if (!user) return;
    if (!isMounted.current) return;
    
    // Create hydration record with current timestamp for optimistic update
    const timestamp = new Date();
    const record = createHydrationRecord(amount, timestamp, drinkType, drinkName);
    const newTotal = (dailyHydration?.total || 0) + amount;
    const pendingLog = { amount, drinkType, drinkName, timestamp };
    
    // Optimistically update UI immediately
    setDailyHydration(prev => {
      if (!prev) return prev;
      
      const newLogs = [...prev.logs, record];
      
      return {
        ...prev,
        total: newTotal,
        logs: newLogs,
        lastUpdated: timestamp
      };
    });
    
    // Track that we have pending updates
    setPendingUpdates(true);
    setPendingLogs(prev => [...prev, pendingLog]);
    
    try {
      const today = getCurrentDateString();
      const docRef = doc(db, 'users', user.uid, 'hydration', today);
      
      // Update Firestore
      await updateDoc(docRef, {
        total: newTotal,
        logs: arrayUnion({
          amount,
          drinkType,
          drinkName,
          timestamp: serverTimestamp()
        }),
        lastUpdated: serverTimestamp()
      });
      
      // Skip state updates if component unmounted
      if (!isMounted.current) return;
      
      // Success: Remove from pending logs
      setPendingLogs(prev => prev.filter(log => log.timestamp !== timestamp));
      if (pendingLogs.length <= 1) {
        setPendingUpdates(false);
      }
    } catch (error) {
      // Skip console logging in production to prevent render churn
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to log hydration:', error);
      }
      
      // Skip state updates if component unmounted
      if (!isMounted.current) return;
      
      // Revert the optimistic update on error
      setDailyHydration(prev => {
        if (!prev) return prev;
        
        // Filter out the optimistically added log
        const revertedLogs = prev.logs.filter(log => 
          !(log.amount === amount && log.timestamp === timestamp)
        );
        
        // Recalculate the total
        const revertedTotal = prev.total - amount;
        
        return {
          ...prev,
          total: revertedTotal,
          logs: revertedLogs,
          lastUpdated: new Date()
        };
      });
      
      setError('Failed to log hydration. Your changes will be saved when you reconnect.');
    }
  }, [user, dailyHydration, getCurrentDateString, createHydrationRecord]);

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

  // Function to retry sending any pending logs that failed due to network issues
  const retryPendingLogs = useCallback(async () => {
    if (pendingLogs.length === 0 || !user) return;
    
    setPendingUpdates(true);
    let success = true;
    
    try {
      const today = getCurrentDateString();
      const docRef = doc(db, 'users', user.uid, 'hydration', today);
      
      // Get current data first to ensure we have the right total
      const docSnap = await getDoc(docRef);
      let currentTotal = 0;
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        currentTotal = data.total || 0;
      }
      
      // Process each pending log
      for (const log of pendingLogs) {
        try {
          // Update Firestore with each log
          await updateDoc(docRef, {
            total: currentTotal + log.amount,
            logs: arrayUnion({
              amount: log.amount,
              drinkType: log.drinkType,
              drinkName: log.drinkName,
              timestamp: serverTimestamp()
            }),
            lastUpdated: serverTimestamp()
          });
          
          // Update running total for next iteration
          currentTotal += log.amount;
        } catch (error) {
          console.error('Failed to sync log during retry:', error);
          success = false;
          break;
        }
      }
      
      if (success) {
        // All logs synced successfully
        setPendingLogs([]);
        setPendingUpdates(false);
        setError(null);
      }
    } catch (error) {
      console.error('Failed to retry pending logs:', error);
      setError('Failed to sync your hydration logs. Please try again later.');
    }
  }, [pendingLogs, user, getCurrentDateString]);
  
  // Retry pending logs when user reconnects
  useEffect(() => {
    if (!user || typeof window === 'undefined') return;
    
    const handleOnline = () => {
      if (pendingLogs.length > 0) {
        retryPendingLogs();
      }
    };
    
    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [pendingLogs.length, retryPendingLogs, user]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => {
    return {
      dailyHydration,
      hydrationGoal,
      hydrationPercentage,
      logHydration,
      updateHydrationGoal,
      isLoading,
      error,
      pendingUpdates,
      retryPendingLogs
    };
  }, [
    dailyHydration,
    hydrationGoal,
    hydrationPercentage,
    logHydration,
    updateHydrationGoal,
    isLoading,
    error,
    pendingUpdates,
    retryPendingLogs
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
