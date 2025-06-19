"use server";

import { db } from "@/lib/firebase";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { revalidatePath } from "next/cache";
import type { UserSettings, UserProfile } from "@/lib/types";

export async function updateUserSettings(userId: string, settings: Partial<UserSettings>) {
  if (!userId) {
    return { error: "User not authenticated." };
  }

  try {
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, settings);
    revalidatePath("/dashboard");
    revalidatePath("/settings");
    return { success: "Settings updated successfully." };
  } catch (error) {
    console.error("Error updating user settings:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update settings.";
    return { error: errorMessage };
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!userId) return null;
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      // This needs to reconstruct the FirebaseUser parts if needed, or just return profile data
      // For simplicity here, just returning the Firestore part. AuthContext handles merging.
      return userDoc.data() as UserProfile; 
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}
