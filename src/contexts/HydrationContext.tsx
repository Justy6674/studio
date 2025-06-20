'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
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

  // Calculate hydration percentage
  const hydrationPercentage = dailyHydration
    ? Math.min(Math.round((dailyHydration.total / hydrationGoal) * 100), 100)
    : 0;

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

    setIsLoading(true);
    setError(null);
    
    try {
      const today = getCurrentDateString();
      const docRef = doc(db, 'users', user.uid, 'hydration', today);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as Omit<DailyHydration, 'date'>;
        const logs = (data.logs || []).map((log: any) => 
          createHydrationRecord(log.amount, log.timestamp)
        );
        
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
        setDailyHydration(newHydration);
      }
    } catch (err) {
      console.error('Error loading hydration data:', err);
      setError('Failed to load hydration data');
    } finally {
      setIsLoading(false);
    }
  }, [user, getCurrentDateString, createHydrationRecord, toDate]);

  useEffect(() => {
    loadHydrationData().catch(err => {
      console.error("Failed to load hydration data from useEffect:", err);
      setError('An unexpected error occurred while loading data.');
    });
  }, [loadHydrationData]);

  const logHydration = useCallback(async (amount: number) => {
    if (!user || !dailyHydration) return;

    try {
      setIsLoading(true);
      setError(null);

      const today = getCurrentDateString();
      const docRef = doc(db, 'users', user.uid, 'hydration', today);

      // Atomically update the document in Firestore
      await updateDoc(docRef, {
        total: dailyHydration.total + amount,
        logs: arrayUnion({ amount, timestamp: serverTimestamp() }),
        lastUpdated: serverTimestamp(),
      });

      // Optimistically update the local state for a responsive UI
      const newLogForState = createHydrationRecord(amount, new Date());
      const updatedLogs = [...dailyHydration.logs, newLogForState];
      const updatedHydration: DailyHydration = {
        ...dailyHydration,
        total: dailyHydration.total + amount,
        logs: updatedLogs,
        lastUpdated: new Date(),
      };

      setDailyHydration(updatedHydration);

      // Check for hydration milestones
      if (updatedHydration.total >= hydrationGoal) {
        // 100% hydration - show celebration
        // This will be handled by the UI component
      } else if (
        updatedHydration.total >= hydrationGoal * 0.5 &&
        dailyHydration.total < hydrationGoal * 0.5
      ) {
        // Crossed 50% - show encouragement
        // This will be handled by the UI component
      }
    } catch (err) {
      console.error('Error logging hydration:', err);
      setError('Failed to log hydration');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user, dailyHydration, getCurrentDateString, createHydrationRecord, hydrationGoal]);

  const updateHydrationGoal = useCallback(async (newGoal: number) => {
    if (!user || !dailyHydration) return;

    try {
      setIsLoading(true);
      setError(null);

      const docRef = doc(db, 'users', user.uid, 'hydration', dailyHydration.date);
      await updateDoc(docRef, {
        goal: newGoal
      });

      setHydrationGoal(newGoal);
      setDailyHydration({
        ...dailyHydration,
        goal: newGoal
      });
    } catch (err) {
      console.error('Error updating hydration goal:', err);
      setError('Failed to update hydration goal');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user, dailyHydration]);

  return (
    <HydrationContext.Provider
      value={{
        dailyHydration,
        hydrationGoal,
        hydrationPercentage,
        logHydration,
        updateHydrationGoal,
        isLoading,
        error,
      }}
    >
      {children}
    </HydrationContext.Provider>
  );
}

export const useHydration = () => {
  const context = useContext(HydrationContext);
  if (context === undefined) {
    throw new Error('useHydration must be used within a HydrationProvider');
  }
  return context;
};
