'use client';

import { auth, db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, Timestamp, doc, updateDoc, getDoc } from "firebase/firestore";
import type { HydrationLog, UserProfile } from "@/lib/types";

export async function logHydration(amount: number): Promise<{ success?: string; error?: string }> {
  const user = auth.currentUser;
  if (!user) {
    return { error: "User not authenticated." };
  }
  if (amount <= 0) {
    return { error: "Amount must be positive." };
  }

  try {
    // Add the hydration log
    await addDoc(collection(db, "hydration_logs"), {
      userId: user.uid,
      amount,
      timestamp: serverTimestamp(),
    });

    // Update user streak
    const userDocRef = doc(db, "users", user.uid);
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

    return { success: "Hydration logged successfully!" };
  } catch (error: any) {
    console.error("Error logging hydration:", error);
    return { error: error.message || "Failed to log hydration." };
  }
}

export async function getHydrationLogs(limit = 7): Promise<HydrationLog[]> {
  const user = auth.currentUser;
  if (!user) {
    console.warn("No authenticated user for getHydrationLogs");
    return [];
  }
  
  try {
    const q = query(
      collection(db, "hydration_logs"),
      where("userId", "==", user.uid),
      orderBy("timestamp", "desc"),
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

export async function getAIMotivation(hydrationGoal: number): Promise<{ message: string; error?: string; source?: string; tone?: string }> {
  const user = auth.currentUser;
  if (!user) {
    return { message: "Login to get personalised motivation.", error: "Not authenticated" };
  }

  try {
    // Get today's logs and calculate comprehensive stats
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    
    const q = query(
      collection(db, "hydration_logs"),
      where("userId", "==", user.uid),
      where("timestamp", ">=", Timestamp.fromDate(todayStart)),
      where("timestamp", "<", Timestamp.fromDate(todayEnd)),
      orderBy("timestamp", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const todayLogs = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        amount: data.amount as number,
        timestamp: (data.timestamp as Timestamp).toDate(),
      };
    });

    // Calculate today's total ml
    const ml_logged_today = todayLogs.reduce((total, log) => total + log.amount, 0);
    const percent_of_goal = Math.round((ml_logged_today / hydrationGoal) * 100);
    
    // Get user profile for streak data
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);
    let current_streak = 0;
    let best_streak = 0;
    let isFirstLog = false;
    
    if (userDoc.exists()) {
      const userData = userDoc.data() as UserProfile;
      current_streak = userData.dailyStreak || 0;
      best_streak = userData.longestStreak || 0;
    }

    // Check if this is their first ever log
    const allLogsQuery = query(
      collection(db, "hydration_logs"),
      where("userId", "==", user.uid),
      orderBy("timestamp", "asc")
    );
    const allLogsSnapshot = await getDocs(allLogsQuery);
    isFirstLog = allLogsSnapshot.docs.length === 0;

    // Get last log time
    const lastLogTime = todayLogs.length > 0 
      ? todayLogs[0].timestamp.toISOString() 
      : undefined;

    // Add contextual data
    const now = new Date();
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
    const hour = now.getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

    // Call the enhanced API with comprehensive stats
    const response = await fetch('/api/ai/motivation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user.uid,
        ml_logged_today,
        goal_ml: hydrationGoal,
        percent_of_goal,
        current_streak,
        best_streak,
        last_log_time: lastLogTime,
        is_first_log: isFirstLog,
        day_of_week: dayOfWeek,
        time_of_day: timeOfDay,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const result = await response.json();
    return { 
      message: result.message || "Keep hydrating! 💧", 
      source: result.source,
      tone: result.tone 
    };
    
  } catch (error) {
    console.error("Error generating AI motivation:", error);
    
    // Enhanced fallback messages
    const fallbacks = [
      "Every drop counts! Keep building that healthy habit! 💧",
      "Hydration hero in training! You're doing great! 🌟💧",
      "Water is your body's best friend. Keep it flowing! 💙💧",
      "Small sips, big impact! Your health thanks you! 🚿💧",
      "Stay consistent, stay hydrated! You've got this! 💪💧"
    ];
    const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    return { message: randomFallback, error: "AI service unavailable", source: "client_fallback" };
  }
} 