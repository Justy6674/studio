"use server";

import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, Timestamp, doc, updateDoc, getDoc } from "firebase/firestore";
import { revalidatePath } from "next/cache";
import { generateMotivationalSms, type GenerateMotivationalSmsInput } from "@/ai/flows/generate-motivational-sms";
import type { HydrationLog, UserProfile } from "@/lib/types";

export async function logHydration(userId: string, amount: number) {
  if (!userId) {
    return { error: "User not authenticated." };
  }
  if (amount <= 0) {
    return { error: "Amount must be positive." };
  }

  try {
    await addDoc(collection(db, "hydration_logs"), {
      userId,
      amount,
      timestamp: serverTimestamp(),
    });

    // Update streak
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      const userData = userDoc.data() as UserProfile;
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      let dailyStreak = userData.dailyStreak || 0;
      let longestStreak = userData.longestStreak || 0;

      if (userData.lastLogDate === today) {
        // Already logged today, no change to streak start
      } else {
        // Check if yesterday was logged
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (userData.lastLogDate === yesterdayStr) {
          dailyStreak += 1;
        } else {
          dailyStreak = 1; // Reset streak
        }
      }
      
      if (dailyStreak > longestStreak) {
        longestStreak = dailyStreak;
      }

      await updateDoc(userDocRef, {
        lastLogDate: today,
        dailyStreak,
        longestStreak,
      });
    }

    revalidatePath("/dashboard");
    return { success: "Hydration logged successfully." };
  } catch (error) {
    console.error("Error logging hydration:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to log hydration.";
    return { error: errorMessage };
  }
}

export async function getHydrationLogs(userId: string): Promise<HydrationLog[]> {
  if (!userId) {
    return [];
  }
  try {
    const q = query(
      collection(db, "hydration_logs"),
      where("userId", "==", userId),
      orderBy("timestamp", "desc"),
      // limit(limit) // Limit can be applied if needed for specific views
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        amount: data.amount,
        timestamp: (data.timestamp as Timestamp).toDate(),
      };
    });
  } catch (error) {
    console.error("Error fetching hydration logs:", error);
    return [];
  }
}


export async function getAIMotivation(userId: string, hydrationGoal: number): Promise<string> {
  try {
    // 1. Get user profile for tone and streak
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      console.error("User not found for AI motivation");
      return "Keep up the great work!";
    }
    const userData = userDoc.data() as UserProfile;
    const tone = userData.motivationTone || 'default';
    const current_streak = userData.dailyStreak || 0;

    // 2. Calculate today's total hydration
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfToday = Timestamp.fromDate(today);

    const q = query(
      collection(db, "hydration_logs"),
      where("userId", "==", userId),
      where("timestamp", ">=", startOfToday)
    );
    const querySnapshot = await getDocs(q);
    const ml_logged_today = querySnapshot.docs.reduce((sum, doc) => sum + doc.data().amount, 0);

    // 3. Prepare input for the AI function
    const input: GenerateMotivationalSmsInput = {
      tone,
      ml_logged_today,
      goal_ml: hydrationGoal,
      current_streak,
    };

    // 4. Generate motivation
    const result = await generateMotivationalSms(input);
    return result.message;

  } catch (error) {
    console.error("Error generating AI motivation:", error);
    return "You're doing an amazing job! Keep hydrating.";
  }
}
