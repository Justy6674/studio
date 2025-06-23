'use client';

import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { showMotivationNotification, sendHydrationSmsReminder } from '@/lib/notifications';

// Define types for hydration patterns
interface HydrationPattern {
  morningAvg: number;
  afternoonAvg: number;
  eveningAvg: number;
  totalAvg: number;
  gapHours: number[];
  lastLogTime: Date | null;
  daysWithLogs: number;
}

interface ContextualReminderOptions {
  userId: string;
  phoneNumber?: string;
  smsEnabled: boolean;
  motivationTone: string;
  pushNotifications: boolean;
  hydrationGoal: number;
  getFreshIdToken?: () => Promise<string | null>;
}

// Time periods for analysis
const MORNING_START = 5; // 5 AM
const MORNING_END = 11; // 11 AM
const AFTERNOON_START = 11; // 11 AM
const AFTERNOON_END = 17; // 5 PM
const EVENING_START = 17; // 5 PM
const EVENING_END = 23; // 11 PM

/**
 * Analyzes user's hydration logs to identify patterns
 */
export async function analyzeHydrationPatterns(userId: string): Promise<HydrationPattern> {
  // Default pattern with no data
  const defaultPattern: HydrationPattern = {
    morningAvg: 0,
    afternoonAvg: 0,
    eveningAvg: 0,
    totalAvg: 0,
    gapHours: [],
    lastLogTime: null,
    daysWithLogs: 0
  };

  try {
    // Get hydration logs from the past 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const logsRef = collection(db, 'hydrationLogs');
    const q = query(
      logsRef,
      where('userId', '==', userId),
      where('timestamp', '>=', sevenDaysAgo),
      orderBy('timestamp', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return defaultPattern;
    }
    
    // Process logs to identify patterns
    const logs = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date()
    }));
    
    // Group logs by day
    const logsByDay: Record<string, any[]> = {};
    let lastLogTime: Date | null = null;
    
    logs.forEach(log => {
      const date = log.timestamp.toISOString().split('T')[0];
      if (!logsByDay[date]) {
        logsByDay[date] = [];
      }
      logsByDay[date].push(log);
      
      // Track the most recent log time
      if (!lastLogTime || log.timestamp > lastLogTime) {
        lastLogTime = log.timestamp;
      }
    });
    
    // Calculate averages by time period
    let morningTotal = 0;
    let morningCount = 0;
    let afternoonTotal = 0;
    let afternoonCount = 0;
    let eveningTotal = 0;
    let eveningCount = 0;
    let dailyTotals: number[] = [];
    
    // Track gaps between logs
    const hourCounts: Record<number, number> = {};
    for (let i = 0; i < 24; i++) {
      hourCounts[i] = 0;
    }
    
    Object.values(logsByDay).forEach(dayLogs => {
      let dayTotal = 0;
      
      dayLogs.forEach(log => {
        const hour = log.timestamp.getHours();
        const amount = log.amount || 0;
        
        // Count logs by hour
        hourCounts[hour]++;
        
        // Add to time period totals
        if (hour >= MORNING_START && hour < MORNING_END) {
          morningTotal += amount;
          morningCount++;
        } else if (hour >= AFTERNOON_START && hour < AFTERNOON_END) {
          afternoonTotal += amount;
          afternoonCount++;
        } else if (hour >= EVENING_START && hour < EVENING_END) {
          eveningTotal += amount;
          eveningCount++;
        }
        
        dayTotal += amount;
      });
      
      dailyTotals.push(dayTotal);
    });
    
    // Calculate averages
    const morningAvg = morningCount > 0 ? morningTotal / morningCount : 0;
    const afternoonAvg = afternoonCount > 0 ? afternoonTotal / afternoonCount : 0;
    const eveningAvg = eveningCount > 0 ? eveningTotal / eveningCount : 0;
    const totalAvg = dailyTotals.length > 0 ? dailyTotals.reduce((a, b) => a + b, 0) / dailyTotals.length : 0;
    
    // Find gaps (hours with no logs)
    const gapHours: number[] = [];
    for (let i = 8; i < 22; i++) { // Only consider waking hours (8 AM to 10 PM)
      if (hourCounts[i] === 0) {
        gapHours.push(i);
      }
    }
    
    return {
      morningAvg,
      afternoonAvg,
      eveningAvg,
      totalAvg,
      gapHours,
      lastLogTime,
      daysWithLogs: Object.keys(logsByDay).length
    };
  } catch (error) {
    console.error('Error analyzing hydration patterns:', error);
    return defaultPattern;
  }
}

/**
 * Generates contextual reminders based on user's hydration patterns
 */
export async function generateContextualReminder(options: ContextualReminderOptions): Promise<boolean> {
  try {
    const { userId, phoneNumber, smsEnabled, motivationTone, pushNotifications, hydrationGoal, getFreshIdToken } = options;
    
    // Get user's hydration patterns
    const patterns = await analyzeHydrationPatterns(userId);
    
    // Get current time
    const now = new Date();
    const currentHour = now.getHours();
    
    // Get today's hydration progress
    const todayStr = now.toISOString().split('T')[0];
    const progressRef = doc(db, 'hydrationProgress', `${userId}_${todayStr}`);
    const progressSnap = await getDoc(progressRef);
    const currentProgress = progressSnap.exists() ? progressSnap.data().total || 0 : 0;
    const progressPercentage = Math.round((currentProgress / hydrationGoal) * 100);
    
    // Determine if we need to send a reminder
    let shouldSendReminder = false;
    let reminderMessage = '';
    
    // Check if it's been more than 2 hours since last log
    const twoHoursAgo = new Date();
    twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);
    
    if (patterns.lastLogTime && patterns.lastLogTime < twoHoursAgo) {
      shouldSendReminder = true;
    }
    
    // Check if we're in a typical gap hour
    if (patterns.gapHours.includes(currentHour)) {
      shouldSendReminder = true;
    }
    
    // Check if progress is behind schedule for the time of day
    const dayProgress = currentHour / 24;
    const expectedProgress = hydrationGoal * dayProgress;
    if (currentProgress < expectedProgress * 0.8) { // 20% behind expected
      shouldSendReminder = true;
    }
    
    if (!shouldSendReminder) {
      return false;
    }
    
    // Generate contextual message based on patterns and time of day
    if (currentHour >= MORNING_START && currentHour < MORNING_END) {
      if (patterns.morningAvg < patterns.afternoonAvg && patterns.morningAvg < patterns.eveningAvg) {
        reminderMessage = `You typically drink less in the morning. Starting your day with water boosts metabolism!`;
      } else {
        reminderMessage = `Good morning! Time for your first hydration of the day.`;
      }
    } else if (currentHour >= AFTERNOON_START && currentHour < AFTERNOON_END) {
      if (progressPercentage < 40) {
        reminderMessage = `You're at ${progressPercentage}% of your daily goal. A midday boost will help you catch up!`;
      } else {
        reminderMessage = `Afternoon slump? Water can help boost your energy levels!`;
      }
    } else if (currentHour >= EVENING_START && currentHour < EVENING_END) {
      if (progressPercentage < 70) {
        reminderMessage = `You're at ${progressPercentage}% of your daily goal. Still time to reach 100%!`;
      } else if (patterns.eveningAvg > patterns.morningAvg + patterns.afternoonAvg) {
        reminderMessage = `I notice you tend to catch up on hydration in the evening. Try spreading it throughout the day!`;
      } else {
        reminderMessage = `Evening reminder: Stay hydrated to sleep better tonight!`;
      }
    }
    
    // Add pattern-based insights
    if (patterns.daysWithLogs >= 3) {
      if (patterns.totalAvg < hydrationGoal * 0.7) {
        reminderMessage += ` You've been averaging ${Math.round(patterns.totalAvg)}ml daily, which is below your goal.`;
      } else if (patterns.totalAvg >= hydrationGoal) {
        reminderMessage += ` Great job maintaining your hydration goals this week!`;
      }
    }
    
    // Send the reminder
    if (smsEnabled && phoneNumber && getFreshIdToken) {
      // Try SMS first
      const result = await sendHydrationSmsReminder(
        phoneNumber,
        reminderMessage,
        motivationTone,
        getFreshIdToken
      );
      
      // If SMS failed or limit reached, fall back to notification
      if (!result.success || result.type === 'popup') {
        if (pushNotifications) {
          return await showMotivationNotification(reminderMessage, motivationTone);
        }
      }
      
      return result.success;
    } else if (pushNotifications) {
      // Just use notification
      return await showMotivationNotification(reminderMessage, motivationTone);
    }
    
    return false;
  } catch (error) {
    console.error('Error generating contextual reminder:', error);
    return false;
  }
}

/**
 * Check and send contextual reminders if needed
 */
export async function checkAndSendContextualReminder(options: ContextualReminderOptions): Promise<boolean> {
  try {
    // Check if we've sent a reminder recently (within last hour)
    const lastReminderKey = `lastContextualReminder_${options.userId}`;
    const lastReminderTime = localStorage.getItem(lastReminderKey);
    
    if (lastReminderTime) {
      const lastTime = new Date(lastReminderTime);
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);
      
      if (lastTime > oneHourAgo) {
        // Don't send more than one reminder per hour
        return false;
      }
    }
    
    const result = await generateContextualReminder(options);
    
    if (result) {
      // Store the time we sent this reminder
      localStorage.setItem(lastReminderKey, new Date().toISOString());
    }
    
    return result;
  } catch (error) {
    console.error('Error checking and sending contextual reminder:', error);
    return false;
  }
}
