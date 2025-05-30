'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
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

  // Check if user has active subscription
  const hasActiveSubscription = (): boolean => {
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
  };

  // Load user profile from Firestore
  const loadUserProfile = async (userId: string) => {
    try {
      const docRef = doc(db, "users", userId);
      const docSnap = await getDoc(docRef);
      
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
          motivationTone: 'Default',
          motivationFrequency: 'Every log',
          subscriptionStatus: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        await setDoc(docRef, defaultProfile);
        setUserProfile(defaultProfile);
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  };

  // Update user profile
  const updateUserProfileData = async (data: Partial<UserProfile>) => {
    if (!user) throw new Error("No user logged in");
    
    try {
      const docRef = doc(db, "users", user.uid);
      const updateData = {
        ...data,
        updatedAt: new Date(),
      };
      
      await updateDoc(docRef, updateData);
      
      // Update local state
      setUserProfile(prev => prev ? { ...prev, ...updateData } : null);
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  };

  // Sign in with optional persistence setting
  const signIn = async (email: string, password: string, staySignedIn: boolean = true) => {
    try {
      // Set persistence before signing in
      if (staySignedIn) {
        await setPersistence(auth, browserLocalPersistence);
      } else {
        await setPersistence(auth, browserSessionPersistence);
      }
      
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error("Sign in error:", error);
      throw error;
    }
  };

  // Sign up
  const signUp = async (email: string, password: string, name?: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user profile in Firestore
      const userProfile: UserProfile = {
        uid: result.user.uid,
        email: result.user.email,
        name: name || "",
        hydrationGoal: 2000,
        sipAmount: 50,
        motivationTone: 'Default',
        motivationFrequency: 'Every log',
        subscriptionStatus: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await setDoc(doc(db, "users", result.user.uid), userProfile);
      setUserProfile(userProfile);
    } catch (error: any) {
      console.error("Sign up error:", error);
      throw error;
    }
  };

  // Sign out
  const logOut = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
    } catch (error: any) {
      console.error("Sign out error:", error);
      throw error;
    }
  };

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        setIsSubscriptionLoading(true);
        await loadUserProfile(user.uid);
        setIsSubscriptionLoading(false);
      } else {
        setUserProfile(null);
        setIsSubscriptionLoading(false);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
