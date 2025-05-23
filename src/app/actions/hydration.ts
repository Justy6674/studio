"use server";

import { auth, db } from "@/lib/firebase";
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
  } catch (error: any) {
    console.error("Error logging hydration:", error);
    return { error: error.message || "Failed to log hydration." };
  }
}

export async function getHydrationLogs(userId: string, limit = 7): Promise<HydrationLog[]> {
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
  if (!userId) {
    return "Login to get personalized motivation.";
  }

  try {
    // Fetch recent hydration logs for the user (last 48 hours)
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    const q = query(
      collection(db, "hydration_logs"),
      where("userId", "==", userId),
      where("timestamp", ">=", Timestamp.fromDate(twoDaysAgo)),
      orderBy("timestamp", "desc")
    );
    const querySnapshot = await getDocs(q);
    const logs = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        amount: data.amount as number,
        timestamp: (data.timestamp as Timestamp).toDate().toISOString(),
      };
    });

    const input: GenerateMotivationalSmsInput = {
      userId,
      hydrationLogs: logs,
      hydrationGoal,
    };
    
    const result = await generateMotivationalSms(input);
    return result.message;
  } catch (error) {
    console.error("Error generating AI motivation:", error);
    return "Could not fetch motivation at this time. Keep hydrating!";
  }
}
