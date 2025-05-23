"use client";

import type { ReactNode } from "react";
import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser, signOut as firebaseSignOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { UserProfile } from "@/lib/types";
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
          ...firebaseUser,
          uid: firebaseUser.uid, // ensure uid is present
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
          ...profileData,
        };
        setUser(fullUserProfile);
        return fullUserProfile;
      } else {
        // Create a basic profile if it doesn't exist
        const basicProfile: Partial<UserProfile> = {
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || "User",
          hydrationGoal: 2000, // Default goal
          reminderTimes: { '08:00': false, '12:00': true, '16:00': false },
          dailyStreak: 0,
          longestStreak: 0,
        };
        await setDoc(userDocRef, basicProfile, { merge: true });
        const createdProfile: UserProfile = { ...firebaseUser, ...basicProfile } as UserProfile;
        setUser(createdProfile);
        return createdProfile;
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setUser(null); // Fallback to basic Firebase user if profile fetch fails
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  const updateUserProfileData = async (userId: string, data: Partial<UserProfile>) => {
    const userDocRef = doc(db, "users", userId);
    await setDoc(userDocRef, data, { merge: true });
    if (user) {
      setUser(prevUser => prevUser ? ({ ...prevUser, ...data }) : null);
    }
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
