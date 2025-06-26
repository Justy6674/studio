"use server";

import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, Timestamp, doc, updateDoc, getDoc, setDoc, arrayUnion } from "firebase/firestore";
import { revalidatePath } from "next/cache";
import { generateMotivationalSms, type GenerateMotivationalSmsInput } from "@/ai/flows/generate-motivational-sms";
import type { HydrationLog, UserProfile } from "@/lib/types";

// Enhanced hydration logging with real-time notifications and gamification
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
    let isFirstLogToday = false;
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      currentTotal = data.total || 0;
      currentLogs = data.logs || [];
    } else {
      isFirstLogToday = true;
    }
    
    // Add new log entry
    const newLog = {
      amount,
      timestamp: serverTimestamp()
    };
    
    const newTotal = currentTotal + amount;
    const goalReached = newTotal >= 3000; // Default goal
    const previouslyReachedGoal = currentTotal >= 3000;
    
    // Update or create the document
    await setDoc(docRef, {
      total: newTotal,
      goal: 3000, // Default goal
      logs: arrayUnion(newLog),
      lastUpdated: serverTimestamp()
    }, { merge: true });

    // Update user profile streak and check for achievements
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);
    let achievements = [];
    let isFirstEverLog = false;
    
    if (userDoc.exists()) {
      const userData = userDoc.data() as UserProfile;

      let dailyStreak = userData.dailyStreak || 0;
      let longestStreak = userData.longestStreak || 0;
      let totalHydration = userData.totalHydration || 0;

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

      totalHydration += amount;

      await updateDoc(userDocRef, {
        lastLogDate: today,
        dailyStreak,
        longestStreak,
        totalHydration,
      });

      // Check for achievements
      if (goalReached && !previouslyReachedGoal) {
        achievements.push({ type: 'daily_goal', value: newTotal, isFirstTime: isFirstLogToday });
      }
      
      if (dailyStreak === 7) {
        achievements.push({ type: 'streak_milestone', value: dailyStreak, streakDays: 7 });
      } else if (dailyStreak === 30) {
        achievements.push({ type: 'streak_milestone', value: dailyStreak, streakDays: 30 });
      } else if (dailyStreak === 100) {
        achievements.push({ type: 'streak_milestone', value: dailyStreak, streakDays: 100 });
      }

      // Volume milestones (in liters)
      const totalLiters = Math.floor(totalHydration / 1000);
      const previousLiters = Math.floor((totalHydration - amount) / 1000);
      if (totalLiters > previousLiters && [10, 50, 100, 500, 1000].includes(totalLiters)) {
        achievements.push({ type: 'volume_milestone', value: totalLiters, milestone: totalLiters });
      }

    } else {
      // Create user profile if it doesn't exist - this is their first ever log
      isFirstEverLog = true;
      await setDoc(userDocRef, {
        uid: userId,
        lastLogDate: today,
        dailyStreak: 1,
        longestStreak: 1,
        totalHydration: amount,
        hydrationGoal: 3000,
        createdAt: serverTimestamp()
      });
      
      achievements.push({ type: 'first_log', value: amount, isFirstTime: true });
    }

    // Trigger real-time notifications and gamification
    if (achievements.length > 0) {
      await triggerAchievementNotifications(userId, achievements);
    }

    // Schedule next reminder notification
    await scheduleNextReminder(userId, newTotal, 3000);

    // Log analytics events
    await logAnalyticsEvent(userId, 'hydration_logged', {
      amount,
      newTotal,
      goalReached,
      achievementsTriggered: achievements.length,
      isFirstEverLog,
      isFirstLogToday
    });

    revalidatePath("/dashboard");
    return { 
      success: "Hydration logged successfully.",
      achievements,
      newTotal,
      goalReached: goalReached && !previouslyReachedGoal
    };
  } catch (error) {
    console.error("Error logging hydration:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to log hydration.";
    return { error: errorMessage };
  }
}

// Trigger achievement notifications and gamification
async function triggerAchievementNotifications(userId: string, achievements: any[]) {
  try {
    for (const achievement of achievements) {
      // Log achievement to analytics
      await logAnalyticsEvent(userId, 'achievement_unlocked', {
        achievementType: achievement.type,
        value: achievement.value,
        timestamp: new Date().toISOString()
      });

      // Send push notification for achievement
      await fetch('/api/ai/motivation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          context: 'achievement',
          achievementType: achievement.type,
          value: achievement.value
        })
      }).catch(err => console.error('Failed to send achievement notification:', err));
    }
  } catch (error) {
    console.error('Error triggering achievement notifications:', error);
  }
}

// Schedule next reminder notification based on user preferences
async function scheduleNextReminder(userId: string, currentMl: number, goalMl: number) {
  try {
    // Get user notification preferences
    const prefsDoc = await getDoc(doc(db, 'user_preferences', userId));
    if (!prefsDoc.exists()) return;
    
    const prefs = prefsDoc.data();
    if (!prefs.fcmEnabled) return;

    const progressPercent = (currentMl / goalMl) * 100;
    let reminderDelayMinutes = 60; // Default 1 hour

    // Adjust reminder frequency based on progress and preferences
    if (prefs.notificationFrequency === 'frequent') {
      reminderDelayMinutes = progressPercent < 50 ? 30 : 60;
    } else if (prefs.notificationFrequency === 'minimal') {
      reminderDelayMinutes = progressPercent < 25 ? 120 : 240;
    } else { // moderate
      reminderDelayMinutes = progressPercent < 50 ? 60 : 120;
    }

    // Check time windows
    const now = new Date();
    const currentHour = now.getHours();
    const timeWindows = prefs.timeWindows || ['morning', 'afternoon'];
    
    let shouldSchedule = false;
    if (timeWindows.includes('morning') && currentHour >= 6 && currentHour < 12) shouldSchedule = true;
    if (timeWindows.includes('midday') && currentHour >= 10 && currentHour < 14) shouldSchedule = true;
    if (timeWindows.includes('afternoon') && currentHour >= 14 && currentHour < 18) shouldSchedule = true;
    if (timeWindows.includes('evening') && currentHour >= 18 && currentHour < 22) shouldSchedule = true;

    if (!shouldSchedule) return;

    // Schedule the reminder (this would typically use a job queue or scheduled function)
    const reminderTime = new Date(Date.now() + reminderDelayMinutes * 60 * 1000);
    
    await setDoc(doc(db, 'scheduled_notifications', `${userId}_${Date.now()}`), {
      userId,
      type: 'hydration_reminder',
      scheduledFor: reminderTime,
      currentMl,
      goalMl,
      tone: prefs.motivationTone || 'kind',
      createdAt: serverTimestamp()
    });

  } catch (error) {
    console.error('Error scheduling reminder:', error);
  }
}

// Log analytics events for tracking
async function logAnalyticsEvent(userId: string, eventType: string, data: any) {
  try {
    await addDoc(collection(db, 'analytics_events'), {
      userId,
      eventType,
      data,
      timestamp: serverTimestamp(),
      source: 'hydration_logging'
    });
  } catch (error) {
    console.error('Error logging analytics event:', error);
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
