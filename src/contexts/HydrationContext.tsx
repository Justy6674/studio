'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
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

  // Format date as YYYY-MM-DD
  const getCurrentDateString = () => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  };

  // Calculate hydration percentage
  const hydrationPercentage = dailyHydration 
    ? Math.min(Math.round((dailyHydration.total / hydrationGoal) * 100), 100)
    : 0;

  // Helper to convert Firestore timestamp to Date
  const toDate = (timestamp: MaybeTimestamp): Date => {
    return timestamp instanceof Date ? timestamp : timestamp?.toDate?.() || new Date();
  };
  
  // Helper to create a hydration record
  const createHydrationRecord = (amount: number, timestamp: MaybeTimestamp = new Date()): HydrationRecord => ({
    amount,
    timestamp,
    getDate: () => toDate(timestamp)
  });

  // Load user's hydration data
  useEffect(() => {
    if (!user) return;

    const loadHydrationData = async () => {
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
    };

    loadHydrationData();
  }, [user]);

  // Log hydration
  const logHydration = async (amount: number) => {
    if (!user || !dailyHydration) return;

    try {
      setIsLoading(true);
      setError(null);

      const today = getCurrentDateString();
      const docRef = doc(db, 'users', user.uid, 'hydration', today);
      const newLog = createHydrationRecord(amount, serverTimestamp() as unknown as Timestamp);

      const updatedLogs = [...dailyHydration.logs, newLog];
      const updatedHydration: DailyHydration = {
        ...dailyHydration,
        total: dailyHydration.total + amount,
        logs: updatedLogs,
        lastUpdated: new Date()
      };

      await updateDoc(docRef, {
        total: updatedHydration.total,
        logs: [...updatedHydration.logs],
        lastUpdated: updatedHydration.lastUpdated
      });

      setDailyHydration(updatedHydration);

      // Check for hydration milestones
      if (updatedHydration.total >= hydrationGoal) {
        // 100% hydration - show celebration
        // This will be handled by the UI component
      } else if (updatedHydration.total >= hydrationGoal * 0.5 && 
                dailyHydration.total < hydrationGoal * 0.5) {
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
  };

  // Update hydration goal
  const updateHydrationGoal = async (newGoal: number) => {
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
  };

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
