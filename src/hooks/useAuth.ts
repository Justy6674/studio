
"use client";

import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface UserProfile {
  uid: string;
  name: string;
  email: string;
  hydrationGoal: number;
  dailyStreak: number;
  longestStreak: number;
  createdAt: Date;
}

export function useAuth() {
  const [user, setUser] = useState<(User & Partial<UserProfile>) | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);

  const updateUserProfileData = async (data: Partial<UserProfile>) => {
    if (!user) return;
    
    try {
      await updateDoc(doc(db, 'users', user.uid), data);
      setUser(prev => prev ? { ...prev, ...data } : null);
    } catch (error) {
      console.error('Error updating user profile:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      
      if (firebaseUser) {
        try {
          // Get user profile from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const userData = userDoc.data();
          
          if (userData) {
            setUser({
              ...firebaseUser,
              name: userData.name || firebaseUser.displayName || '',
              hydrationGoal: userData.hydrationGoal || 2000,
              dailyStreak: userData.dailyStreak || 0,
              longestStreak: userData.longestStreak || 0,
              createdAt: userData.createdAt?.toDate() || new Date()
            });
          } else {
            // User document doesn't exist, use Firebase user data
            setUser({
              ...firebaseUser,
              name: firebaseUser.displayName || '',
              hydrationGoal: 2000,
              dailyStreak: 0,
              longestStreak: 0,
              createdAt: new Date()
            });
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUser(firebaseUser as any);
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
      setInitialLoading(false);
    });

    return unsubscribe;
  }, []);

  return {
    user,
    loading,
    initialLoading,
    updateUserProfileData
  };
}
