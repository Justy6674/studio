import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { createAuthenticatedFunction } from "./types/firebase";
import { generateMotivationalMessage } from "./generateMotivationalMessage";
import { subDays, startOfDay, format, parseISO, isAfter, isBefore, addMinutes } from "date-fns";

const twilio = require('twilio');

export interface HydrationReminderRequest {
  tone?: string;
  forceMethod?: 'auto' | 'fcm' | 'sms';
  testMode?: boolean;
  notificationType?: 'sip' | 'glass' | 'walk' | 'drink' | 'herbal_tea' | 'milestone';
}

export interface HydrationReminderResponse {
  success: boolean;
  method: 'fcm' | 'sms' | 'both' | 'none';
  message: string;
  messageText?: string;
  error?: string;
  analytics: any;
}

// Notification frequency intervals (in minutes)
const FREQUENCY_INTERVALS = {
  minimal: [240, 360, 480], // 4-8 hours
  moderate: [120, 180, 240, 360], // 2-6 hours  
  frequent: [60, 90, 120, 150, 180, 240] // 1-4 hours
};

// Notification type configurations
const NOTIFICATION_TYPE_CONFIGS = {
  sip: { defaultAmount: 50, emoji: '💧', label: 'Sip Reminder' },
  glass: { defaultAmount: 250, emoji: '🥤', label: 'Glass Reminder' },
  walk: { defaultAmount: 100, emoji: '🚶‍♂️', label: 'Walk & Drink' },
  drink: { defaultAmount: 200, emoji: '🥛', label: 'General Drink' },
  herbal_tea: { defaultAmount: 200, emoji: '🍵', label: 'Herbal Tea' },
  milestone: { defaultAmount: 0, emoji: '🎯', label: 'Milestone Alert' }
};

export const sendHydrationReminder = createAuthenticatedFunction<HydrationReminderRequest, HydrationReminderResponse>(
  async (data, userId) => {
    const { tone, forceMethod = 'auto', testMode = false, notificationType = 'drink' } = data;
    
    try {
      const db = admin.firestore();
      
      // Get user preferences and profile
      const [userPrefsDoc, userProfileDoc] = await Promise.all([
        db.collection('user_preferences').doc(userId).get(),
        db.collection('users').doc(userId).get()
      ]);

      if (!userPrefsDoc.exists || !userProfileDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'User profile or preferences not found');
      }

      const userPrefs = userPrefsDoc.data()!;
      const userProfile = userProfileDoc.data()!;
      
      // Check if notifications are enabled
      const fcmEnabled = userPrefs.fcmEnabled || false;
      const smsEnabled = userPrefs.smsReminderOn || false;
      const notificationFrequency = userPrefs.notificationFrequency || 'moderate';
      const enabledNotificationTypes = userPrefs.enabledNotificationTypes || ['drink', 'glass'];
      const customIntervals = userPrefs.customNotificationIntervals || {};
      const daySplitConfig = userPrefs.daySplitConfig || { enabled: false, splits: [] };
      
      if (!fcmEnabled && !smsEnabled && !testMode) {
        return {
          success: false,
          method: 'none',
          message: 'All notification methods disabled',
          analytics: await buildAnalytics(userId, userProfile, userPrefs, 'none')
        };
      }

      // Check if this notification type is enabled
      if (!enabledNotificationTypes.includes(notificationType) && !testMode) {
        return {
          success: false,
          method: 'none',
          message: `Notification type '${notificationType}' is disabled`,
          analytics: await buildAnalytics(userId, userProfile, userPrefs, 'none')
        };
      }

      // Calculate current hydration status
      const today = startOfDay(new Date());
      const todayLogsSnapshot = await db.collection('hydration_logs')
        .where('userId', '==', userId)
        .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(today))
        .get();
      
      const currentMl = todayLogsSnapshot.docs.reduce((total, doc) => {
        return total + (doc.data().amount || 0);
      }, 0);
      
      const dailyGoalMl = userProfile.hydrationGoal || 2000;
      const hydrationPercentage = Math.round((currentMl / dailyGoalMl) * 100);
      
      // Calculate streaks
      const currentStreak = await calculateCurrentStreak(userId, dailyGoalMl);
      
      // Check day-splitting milestones
      if (daySplitConfig.enabled && notificationType === 'milestone') {
        const milestoneResult = await checkMilestoneTargets(userId, currentMl, daySplitConfig);
        if (!milestoneResult.shouldNotify) {
          return {
            success: false,
            method: 'none',
            message: 'No milestone targets reached',
            analytics: await buildAnalytics(userId, userProfile, userPrefs, 'none')
          };
        }
      }

      // Check notification timing based on type and custom intervals
      if (!testMode && !shouldSendNotificationByType(userPrefs, notificationType, customIntervals, hydrationPercentage)) {
        return {
          success: false,
          method: 'none',
          message: 'Notification timing not appropriate',
          analytics: await buildAnalytics(userId, userProfile, userPrefs, 'none')
        };
      }

      // Generate AI-powered message text
      const userName = userProfile.name || 'Friend';
      const selectedTone = tone || userPrefs.motivationTone || 'kind';
      
      let messageText: string;
      
      try {
        // Enhanced prompt for different notification types
        const typeConfig = NOTIFICATION_TYPE_CONFIGS[notificationType];
        const typeContext = notificationType === 'milestone' 
          ? `milestone celebration - they've hit a major hydration target!`
          : `${typeConfig.label.toLowerCase()} - suggest ${typeConfig.defaultAmount}ml`;
          
        const prompt = `
          Generate a short, ${selectedTone}-toned push notification for ${userName} about ${typeContext}.
          User consumed: ${currentMl}/${dailyGoalMl} ml today (${hydrationPercentage}%).
          Current streak: ${currentStreak} days.
          Context: This is a ${notificationType} reminder.
          Ensure each message is unique, engaging, and NEVER repetitive.
          Keep it under 100 characters for mobile notifications.
        `;

        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' + functions.config().gemini.api_key, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });

        const result = await response.json();
        messageText = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 
                     getDefaultMessage(selectedTone, notificationType, userName);
      } catch (error) {
        console.error('Gemini API error:', error);
        messageText = getDefaultMessage(selectedTone, notificationType, userName);
      }

      // Determine delivery method
      let deliveryMethod: 'fcm' | 'sms' | 'both' = 'fcm';
      if (forceMethod !== 'auto') {
        deliveryMethod = forceMethod as 'fcm' | 'sms';
      } else if (fcmEnabled && smsEnabled) {
        deliveryMethod = 'fcm';
      } else if (smsEnabled) {
        deliveryMethod = 'sms';
      }

      // Send notification(s)
      const results = await sendNotifications(
        userId, 
        messageText, 
        selectedTone, 
        deliveryMethod, 
        userPrefs,
        {
          currentMl,
          dailyGoalMl,
          percentage: hydrationPercentage,
          streak: currentStreak,
          vibrationEnabled: userPrefs.vibrationEnabled || true,
          notificationType
        }
      );

      // Log analytics
      await logReminderAnalytics(userId, {
        selectedTone,
        method: results.method,
        success: results.success,
        messageText,
        notificationType,
        hydrationStatus: {
          currentMl,
          goalMl: dailyGoalMl,
          percentage: hydrationPercentage
        },
        streakDays: currentStreak,
        testMode
      });

      return {
        success: results.success,
        method: results.method,
        message: results.success ? 'Reminder sent successfully' : 'Failed to send reminder',
        messageText,
        error: results.error,
        analytics: await buildAnalytics(userId, userProfile, userPrefs, results.method)
      };

    } catch (error) {
      console.error('Hydration reminder error:', error);
      throw new functions.https.HttpsError('internal', 'Failed to send hydration reminder');
    }
  }
);

// Check if notification should be sent based on type and custom intervals
function shouldSendNotificationByType(
  userPrefs: any, 
  notificationType: string,
  customIntervals: Record<string, number>,
  hydrationPercentage: number
): boolean {
  const lastNotificationTime = userPrefs.lastNotificationTime?.toDate();
  const now = new Date();
  
  if (!lastNotificationTime) return true; // First notification
  
  const minutesSinceLastNotification = (now.getTime() - lastNotificationTime.getTime()) / (1000 * 60);
  
  // Get custom interval for this notification type
  const customInterval = customIntervals[notificationType];
  if (customInterval && customInterval > 0) {
    return minutesSinceLastNotification >= customInterval;
  }
  
  // Fallback to default frequency logic
  const frequency = userPrefs.notificationFrequency || 'moderate';
  const intervals = FREQUENCY_INTERVALS[frequency as keyof typeof FREQUENCY_INTERVALS] || FREQUENCY_INTERVALS.moderate;
  
  let targetInterval: number;
  if (hydrationPercentage < 25) {
    targetInterval = Math.min(...intervals);
  } else if (hydrationPercentage < 50) {
    targetInterval = intervals[Math.floor(intervals.length / 2)];
  } else {
    targetInterval = Math.max(...intervals);
  }
  
  return minutesSinceLastNotification >= targetInterval;
}

// Check milestone targets for day-splitting
async function checkMilestoneTargets(
  userId: string, 
  currentMl: number, 
  daySplitConfig: any
): Promise<{ shouldNotify: boolean; milestone?: any }> {
  const now = new Date();
  const currentTime = format(now, 'HH:mm');
  
  for (const split of daySplitConfig.splits) {
    if (currentTime >= split.time && currentMl >= split.targetMl) {
      // Check if we've already notified for this milestone today
      const db = admin.firestore();
      const today = format(startOfDay(now), 'yyyy-MM-dd');
      const milestoneKey = `${today}-${split.time}-${split.targetMl}`;
      
      const milestoneDoc = await db.collection('milestone_notifications')
        .doc(userId)
        .collection('daily')
        .doc(milestoneKey)
        .get();
        
      if (!milestoneDoc.exists) {
        // Mark this milestone as notified
        await db.collection('milestone_notifications')
          .doc(userId)
          .collection('daily')
          .doc(milestoneKey)
          .set({
            notifiedAt: admin.firestore.FieldValue.serverTimestamp(),
            targetMl: split.targetMl,
            actualMl: currentMl,
            time: split.time,
            label: split.label
          });
          
        return { shouldNotify: true, milestone: split };
      }
    }
  }
  
  return { shouldNotify: false };
}

// Get default message for notification type
function getDefaultMessage(tone: string, notificationType: string, userName: string): string {
  const typeConfig = NOTIFICATION_TYPE_CONFIGS[notificationType as keyof typeof NOTIFICATION_TYPE_CONFIGS];
  const messages = {
    funny: {
      sip: `${userName}, your cells are sending SOS signals! 💧`,
      glass: `Time for a glass break! Your body will thank you! 🥤`,
      walk: `Walk it off... with water! 🚶‍♂️💧`,
      drink: `Hydration station calling ${userName}! 🥛`,
      herbal_tea: `Tea time for some zen hydration! 🍵`,
      milestone: `🎯 BOOM! You've smashed another hydration milestone!`
    },
    kind: {
      sip: `A gentle reminder to take a small sip, ${userName} 💧`,
      glass: `How about a refreshing glass of water? 🥤`,
      walk: `A little walk and water would be wonderful 🚶‍♂️`,
      drink: `Time for some hydration, dear ${userName} 🥛`,
      herbal_tea: `Perhaps a soothing herbal tea? 🍵`,
      milestone: `🎯 Wonderful! You've reached your hydration milestone!`
    }
    // Add other tones as needed
  };
  
  const toneMessages = messages[tone as keyof typeof messages] || messages.kind;
  return toneMessages[notificationType as keyof typeof toneMessages] || `Time to hydrate, ${userName}!`;
}

// Calculate current streak
async function calculateCurrentStreak(userId: string, dailyGoalMl: number): Promise<number> {
  const db = admin.firestore();
  let streak = 0;
  let currentDate = startOfDay(new Date());
  
  while (true) {
    const dayLogsSnapshot = await db.collection('hydration_logs')
      .where('userId', '==', userId)
      .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(currentDate))
      .where('timestamp', '<', admin.firestore.Timestamp.fromDate(addMinutes(currentDate, 24 * 60)))
      .get();
    
    const dayTotal = dayLogsSnapshot.docs.reduce((total, doc) => {
      return total + (doc.data().amount || 0);
    }, 0);
    
    if (dayTotal >= dailyGoalMl) {
      streak++;
      currentDate = addMinutes(currentDate, -24 * 60); // Go back one day
    } else {
      break;
    }
    
    // Prevent infinite loops
    if (streak > 365) break;
  }
  
  return streak;
}

// Send notifications via FCM and/or SMS
async function sendNotifications(
  userId: string,
  messageText: string, 
  tone: string,
  method: 'fcm' | 'sms' | 'both',
  userPrefs: any,
  hydrationData: any
): Promise<{ success: boolean; method: 'fcm' | 'sms' | 'both' | 'none'; error?: string }> {
  
  let fcmSuccess = false;
  let smsSuccess = false;
  let lastError = '';

  // Send FCM notification
  if (method === 'fcm' || method === 'both') {
    try {
      const fcmToken = userPrefs.fcmToken;
      if (fcmToken) {
        const toneEmojis = {
          funny: '😂', kind: '😊', motivational: '💪', sarcastic: '🙄',
          strict: '🧐', supportive: '🤗', crass: '💥', weightloss: '🏋️‍♀️'
        };
        
        const emoji = toneEmojis[tone as keyof typeof toneEmojis] || '💧';
        const typeConfig = NOTIFICATION_TYPE_CONFIGS[hydrationData.notificationType as keyof typeof NOTIFICATION_TYPE_CONFIGS];
        const vibrationPattern = hydrationData.vibrationEnabled ? '200,100,200,100,200' : '';
        
        const fcmMessage = {
          token: fcmToken,
          notification: {
            title: `${emoji} ${typeConfig?.label || 'Water4WeightLoss'}`,
            body: messageText
          },
          data: {
            tone,
            notificationType: hydrationData.notificationType,
            hydrationPercentage: hydrationData.percentage.toString(),
            currentMl: hydrationData.currentMl.toString(),
            goalMl: hydrationData.dailyGoalMl.toString(),
            streak: hydrationData.streak.toString(),
            vibrationPattern,
            action: 'hydration_reminder',
            url: '/dashboard?action=log-water'
          },
          android: {
            priority: 'high' as const,
            notification: {
              vibrationPattern: hydrationData.vibrationEnabled ? [200, 100, 200, 100, 200] : undefined,
              sound: 'default',
              channelId: 'hydration_reminders'
            }
          },
          apns: {
            payload: {
              aps: {
                sound: 'default',
                badge: 1
              }
            }
          }
        };

        await admin.messaging().send(fcmMessage);
        fcmSuccess = true;
        console.log(`FCM notification sent to user ${userId} for ${hydrationData.notificationType}`);
      } else {
        lastError = 'No FCM token available';
      }
    } catch (error) {
      console.error('FCM notification failed:', error);
      lastError = `FCM failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  // Send SMS notification (fallback or primary)
  if ((method === 'sms' || method === 'both') || (!fcmSuccess && method === 'fcm')) {
    try {
      const phoneNumber = userPrefs.phoneNumber;
      const twilioAccountSid = functions.config().twilio?.sid;
      const twilioAuthToken = functions.config().twilio?.authtoken;
      const twilioPhoneNumber = functions.config().twilio?.phonenumber;

      if (phoneNumber && twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
        const twilioClient = twilio(twilioAccountSid, twilioAuthToken);
        await twilioClient.messages.create({
          body: messageText,
          from: twilioPhoneNumber,
          to: phoneNumber
        });
        smsSuccess = true;
        console.log(`SMS notification sent to user ${userId} for ${hydrationData.notificationType}`);
      } else {
        lastError += ' SMS configuration incomplete';
      }
    } catch (error) {
      console.error('SMS notification failed:', error);
      lastError += ` SMS failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  // Update last notification time
  if (fcmSuccess || smsSuccess) {
    await admin.firestore().collection('user_preferences').doc(userId).update({
      lastNotificationTime: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  const finalMethod = fcmSuccess && smsSuccess ? 'both' : 
                     fcmSuccess ? 'fcm' : 
                     smsSuccess ? 'sms' : 'none';

  return {
    success: fcmSuccess || smsSuccess,
    method: finalMethod,
    error: lastError || undefined
  };
}

// Log reminder analytics
async function logReminderAnalytics(userId: string, data: any): Promise<void> {
  try {
    await admin.firestore().collection('analytics_events').add({
      userId,
      eventType: 'hydration_reminder_sent',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      data: {
        tone: data.selectedTone,
        method: data.method,
        success: data.success,
        messageText: data.messageText,
        notificationType: data.notificationType,
        hydrationStatus: data.hydrationStatus,
        streakDays: data.streakDays,
        testMode: data.testMode
      }
    });
  } catch (error) {
    console.error('Failed to log reminder analytics:', error);
  }
}

// Build analytics response
async function buildAnalytics(userId: string, userProfile: any, userPrefs: any, method: string): Promise<any> {
  const now = new Date();
  
  return {
    userId,
    timestamp: now.toISOString(),
    method,
    userProfile: {
      name: userProfile.name || 'Unknown',
      hydrationGoal: userProfile.hydrationGoal || 2000
    },
    preferences: {
      fcmEnabled: userPrefs.fcmEnabled || false,
      smsEnabled: userPrefs.smsReminderOn || false,
      notificationFrequency: userPrefs.notificationFrequency || 'moderate',
      enabledNotificationTypes: userPrefs.enabledNotificationTypes || [],
      daySplitEnabled: userPrefs.daySplitConfig?.enabled || false
    }
  };
} 