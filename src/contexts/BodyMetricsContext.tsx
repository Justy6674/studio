'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { BodyMetrics, BodyMetricsEntry } from '@/lib/types';

interface BodyMetricsContextType {
  latestMetrics: BodyMetrics | null;
  metricsHistory: BodyMetrics[];
  isLoading: boolean;
  addMetricEntry: (entry: BodyMetricsEntry) => Promise<void>;
}

const BodyMetricsContext = createContext<BodyMetricsContextType | undefined>(undefined);

export function BodyMetricsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [latestMetrics, setLatestMetrics] = useState<BodyMetrics | null>(null);
  const [metricsHistory, setMetricsHistory] = useState<BodyMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      setLatestMetrics(null);
      setMetricsHistory([]);
      return;
    }

    setIsLoading(true);
    const metricsCollectionRef = collection(db, 'users', user.uid, 'bodyMetrics');
    const q = query(metricsCollectionRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const history: BodyMetrics[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          weight_kg: data.weight_kg,
          waist_cm: data.waist_cm,
          notes: data.notes,
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(),
          userId: user.uid,
        };
      });
      
      setMetricsHistory(history);
      setLatestMetrics(history.length > 0 ? history[0] : null);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching body metrics:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);
  
  const addMetricEntry = useCallback(async (entry: BodyMetricsEntry) => {
      if (!user) throw new Error("User not authenticated");
      
      const metricsCollectionRef = collection(db, 'users', user.uid, 'bodyMetrics');
      await addDoc(metricsCollectionRef, {
          ...entry,
          timestamp: serverTimestamp(),
      });
  }, [user]);

  const value = useMemo(() => ({
    latestMetrics,
    metricsHistory,
    isLoading,
    addMetricEntry,
  }), [latestMetrics, metricsHistory, isLoading, addMetricEntry]);

  return (
    <BodyMetricsContext.Provider value={value}>
      {children}
    </BodyMetricsContext.Provider>
  );
}

export const useBodyMetrics = () => {
  const context = useContext(BodyMetricsContext);
  if (context === undefined) {
    throw new Error('useBodyMetrics must be used within a BodyMetricsProvider');
  }
  return context;
};
