"use client";

import type { ReactNode } from "react";
import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser, signOut as firebaseSignOut } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { UserProfile, UserPreferences, MotivationTone } from "@/lib/types";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  initialLoading: boolean;
  fetchUserProfile: (firebaseUser: FirebaseUser) => Promise<UserProfile | null>;
  updateUserProfileData: (userId: string, data: Partial<UserProfile>) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const router = useRouter();

  const fetchUserProfile = async (firebaseUser: FirebaseUser): Promise<UserProfile | null> => {
    if (!firebaseUser) return null;
    setLoading(true);
    try {
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const profileData = userDoc.data() as Omit<UserProfile, keyof FirebaseUser>;
        const fullUserProfile: UserProfile = {
          // Firebase User properties
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || profileData.name,
          photoURL: firebaseUser.photoURL,
          emailVerified: firebaseUser.emailVerified,
          isAnonymous: firebaseUser.isAnonymous,
          metadata: firebaseUser.metadata,
          providerData: firebaseUser.providerData,
          refreshToken: firebaseUser.refreshToken,
          tenantId: firebaseUser.tenantId,
          delete: firebaseUser.delete,
          getIdToken: firebaseUser.getIdToken,
          getIdTokenResult: firebaseUser.getIdTokenResult,
          reload: firebaseUser.reload,
          toJSON: firebaseUser.toJSON,
          // Custom profile data from Firestore
          ...profileData,
          preferences: profileData.preferences || { tone: 'default' as MotivationTone },
        };
        setUser(fullUserProfile);
        return fullUserProfile;
      } else {
        // Create a basic profile if it doesn't exist
        const basicProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          hydrationGoal: 2000, // Default goal
          reminderTimes: { '08:00': false, '12:00': true, '16:00': false },
          dailyStreak: 0,
          longestStreak: 0,
          preferences: { tone: 'default' as MotivationTone },
          // Required FirebaseUser fields (some might be null/undefined initially)
          emailVerified: firebaseUser.emailVerified,
          isAnonymous: firebaseUser.isAnonymous,
          metadata: firebaseUser.metadata,
          providerData: firebaseUser.providerData,
          refreshToken: firebaseUser.refreshToken,
          tenantId: firebaseUser.tenantId,
          delete: firebaseUser.delete,
          getIdToken: firebaseUser.getIdToken,
          getIdTokenResult: firebaseUser.getIdTokenResult,
          reload: firebaseUser.reload,
          toJSON: firebaseUser.toJSON,
        };
        await setDoc(userDocRef, { 
            ...basicProfile, 
            createdAt: serverTimestamp(),
            // Explicitly remove FirebaseUser methods before saving to Firestore if they were part of basicProfile
            // For this case, basicProfile is constructed with only data fields.
        });
        setUser(basicProfile);
        return basicProfile;
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      const fallbackProfile: UserProfile = { 
        ...firebaseUser, 
        preferences: { tone: 'default' as MotivationTone } 
      };
      setUser(fallbackProfile); 
      return fallbackProfile;
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfileData = async (userId: string, data: Partial<UserProfile>) => {
    // This function is primarily for client-side state updates after a successful backend update.
    // The actual saving to Firestore should be done by a Firebase Function or Server Action.
    if (user && user.uid === userId) {
      setUser(prevUser => {
        if (!prevUser) return null;
        // Deep merge preferences
        const newPreferences = data.preferences 
          ? { ...prevUser.preferences, ...data.preferences } 
          : prevUser.preferences;
        return { ...prevUser, ...data, preferences: newPreferences };
      });
    }
    // For persisting, ensure updateUserSettings Firebase Function is called from the UI.
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await fetchUserProfile(firebaseUser);
      } else {
        setUser(null);
      }
      setLoading(false);
      setInitialLoading(false);
    });
    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setUser(null);
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, initialLoading, fetchUserProfile, updateUserProfileData, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};