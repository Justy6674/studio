'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo, type ReactNode } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string, staySignedIn?: boolean) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  logOut: () => Promise<void>;
  updateUserProfileData: (data: Partial<UserProfile>) => Promise<void>;
  hasActiveSubscription: () => boolean;
  isSubscriptionLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(false);

  // Check if user has active subscription - memoized with useCallback
  const hasActiveSubscription = useCallback((): boolean => {
    if (!userProfile) return false;
    
    // Developer override for testing/admin accounts
    const devEmails = [
      'admin@water4weightloss.com',
      'demo@water4weightloss.com',
      'test@water4weightloss.com',
      'developer@water4weightloss.com',
      'downscale@icloud.com',
      'downscaleweightloss@gmail.com'
    ];
    
    if (user?.email && devEmails.includes(user.email.toLowerCase())) {
      return true; // Bypass paywall for dev accounts
    }
    
    const status = userProfile.subscriptionStatus;
    return status === 'active' || status === 'trialing';
  }, [user?.email, userProfile]);

  // Track component mount status to prevent state updates after unmount
  const isMounted = useRef<boolean>(true);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Load user profile from Firestore - memoized with useCallback to prevent unnecessary re-renders
  const loadUserProfile = useCallback(async (userId: string) => {
    // Skip if component is unmounted
    if (!isMounted.current) return;
    
    try {
      const docRef = doc(db, "users", userId);
      const docSnap = await getDoc(docRef);
      
      // Skip state update if component unmounted during async operation
      if (!isMounted.current) return;
      
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        setUserProfile(data);
      } else {
        // Create default profile if it doesn't exist
        const defaultProfile: UserProfile = {
          uid: userId,
          email: user?.email,
          hydrationGoal: 2000,
          sipAmount: 50,
          motivationTone: 'motivational',
          motivationFrequency: 'Every log',
          subscriptionStatus: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        await setDoc(docRef, defaultProfile);
        
        // Skip state update if component unmounted during async operation
        if (!isMounted.current) return;
        setUserProfile(defaultProfile);
      }
    } catch (error) {
      // Skip console logging in production to prevent render churn
      if (process.env.NODE_ENV === 'development') {
        console.error("Error loading user profile:", error);
      }
    }
  }, [user?.email]); // Only re-create when user email changes

  // Update user profile - memoized with useCallback
  const updateUserProfileData = useCallback(async (data: Partial<UserProfile>) => {
    if (!user) throw new Error("No user logged in");
    
    try {
      const docRef = doc(db, "users", user.uid);
      const updateData = {
        ...data,
        updatedAt: new Date(),
      };
      
      await updateDoc(docRef, updateData);
      
      // Skip state update if component unmounted during async operation
      if (!isMounted.current) return;
      
      // Update local state
      setUserProfile(prev => prev ? { ...prev, ...updateData } : null);
    } catch (error) {
      // Skip console logging in production to prevent render churn
      if (process.env.NODE_ENV === 'development') {
        console.error("Error updating user profile:", error);
      }
      throw error;
    }
  }, [user]);

  // Sign in with optional persistence setting - memoized with useCallback
  const signIn = useCallback(async (email: string, password: string, staySignedIn: boolean = true) => {
    try {
      // Set persistence before signing in
      if (staySignedIn) {
        await setPersistence(auth, browserLocalPersistence);
      } else {
        await setPersistence(auth, browserSessionPersistence);
      }
      
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: unknown) {
      // Skip console logging in production to prevent render churn
      if (process.env.NODE_ENV === 'development') {
        console.error("Sign in error:", error);
      }
      throw error;
    }
  }, []);

  // Sign up - memoized with useCallback
  const signUp = useCallback(async (email: string, password: string, name?: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user profile in Firestore
      const userProfile: UserProfile = {
        uid: result.user.uid,
        email: result.user.email,
        name: name || "",
        hydrationGoal: 2000,
        sipAmount: 50,
        motivationTone: 'motivational',
        motivationFrequency: 'Every log',
        subscriptionStatus: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await setDoc(doc(db, "users", result.user.uid), userProfile);
      
      // Skip state update if component unmounted during async operation
      if (!isMounted.current) return;
      setUserProfile(userProfile);
    } catch (error: unknown) {
      // Skip console logging in production to prevent render churn
      if (process.env.NODE_ENV === 'development') {
        console.error("Sign up error:", error);
      }
      throw error;
    }
  }, []);

  // Sign out - memoized with useCallback
  const logOut = useCallback(async () => {
    try {
      await signOut(auth);
      
      // Skip state update if component unmounted during async operation
      if (!isMounted.current) return;
      setUserProfile(null);
    } catch (error: unknown) {
      // Skip console logging in production to prevent render churn
      if (process.env.NODE_ENV === 'development') {
        console.error("Sign out error:", error);
      }
      throw error;
    }
  }, []);

  // Auth state listener - with proper cleanup and unmount protection
  useEffect(() => {
    // Skip if SSR
    if (typeof window === 'undefined') return () => {};
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // Skip state updates if component unmounted
      if (!isMounted.current) return;
      
      setUser(currentUser);
      
      if (currentUser) {
        setIsSubscriptionLoading(true);
        await loadUserProfile(currentUser.uid);
        
        // Skip state updates if component unmounted during async operation
        if (!isMounted.current) return;
        setIsSubscriptionLoading(false);
      } else {
        // Skip state updates if component unmounted
        if (!isMounted.current) return;
        setUserProfile(null);
        setIsSubscriptionLoading(false);
      }
      
      // Skip state updates if component unmounted
      if (!isMounted.current) return;
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [loadUserProfile]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => {
    return {
      user,
      userProfile,
      loading,
      signIn,
      signUp,
      logOut,
      updateUserProfileData,
      hasActiveSubscription,
      isSubscriptionLoading,
    };
  }, [
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    logOut,
    updateUserProfileData,
    hasActiveSubscription,
    isSubscriptionLoading
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
