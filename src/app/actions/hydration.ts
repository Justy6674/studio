"use server";

import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, Timestamp, doc, updateDoc, getDoc, setDoc, arrayUnion } from "firebase/firestore";
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
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const docRef = doc(db, 'users', userId, 'hydration', today);
    
    // Get current day's data
    const docSnap = await getDoc(docRef);
    let currentTotal = 0;
    let currentLogs: any[] = [];
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      currentTotal = data.total || 0;
      currentLogs = data.logs || [];
    }
    
    // Add new log entry
    const newLog = {
      amount,
      timestamp: serverTimestamp()
    };
    
    const newTotal = currentTotal + amount;
    
    // Update or create the document
    await setDoc(docRef, {
      total: newTotal,
      goal: 3000, // Default goal
      logs: arrayUnion(newLog),
      lastUpdated: serverTimestamp()
    }, { merge: true });

    // Update user profile streak
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      const userData = userDoc.data() as UserProfile;

      let dailyStreak = userData.dailyStreak || 0;
      let longestStreak = userData.longestStreak || 0;

      if (userData.lastLogDate === today) {
        // Already logged today, no change to streak
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
    } else {
      // Create user profile if it doesn't exist
      await setDoc(userDocRef, {
        uid: userId,
        lastLogDate: today,
        dailyStreak: 1,
        longestStreak: 1,
        hydrationGoal: 3000,
        createdAt: serverTimestamp()
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
    // Get logs from the last 30 days using the new structure
    const logs: HydrationLog[] = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const docRef = doc(db, 'users', userId, 'hydration', dateStr);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const dayLogs = data.logs || [];
        
        dayLogs.forEach((log: any, index: number) => {
          logs.push({
            id: `${dateStr}_${index}`,
            userId,
            amount: log.amount,
            timestamp: log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.timestamp),
          });
        });
      }
    }
    
    // Sort by timestamp descending
    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  } catch (error) {
    console.error("Error fetching hydration logs:", error);
    return [];
  }
}

export async function getAIMotivation(userId: string, hydrationGoal: number): Promise<string> {
  if (!userId) {
    return "Login to get personalised motivation.";
  }

  try {
    // Get recent hydration data from the last 2 days
    const logs: Array<{ amount: number; timestamp: string }> = [];
    const today = new Date();
    
    for (let i = 0; i < 2; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const docRef = doc(db, 'users', userId, 'hydration', dateStr);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const dayLogs = data.logs || [];
        
        dayLogs.forEach((log: any) => {
          logs.push({
            amount: log.amount,
            timestamp: log.timestamp?.toDate ? log.timestamp.toDate().toISOString() : new Date(log.timestamp).toISOString(),
          });
        });
      }
    }

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
