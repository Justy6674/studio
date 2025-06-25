"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendHydrationReminder = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const firebase_1 = require("./types/firebase");
const date_fns_1 = require("date-fns");
const twilio = require('twilio');
// Notification frequency intervals (in minutes)
const FREQUENCY_INTERVALS = {
    minimal: [240, 360, 480], // 4-8 hours
    moderate: [120, 180, 240, 360], // 2-6 hours  
    frequent: [60, 90, 120, 150, 180, 240] // 1-4 hours
};
exports.sendHydrationReminder = (0, firebase_1.createAuthenticatedFunction)(async (data, userId) => {
    const { tone, forceMethod = 'auto', testMode = false } = data;
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
        const userPrefs = userPrefsDoc.data();
        const userProfile = userProfileDoc.data();
        // Check if notifications are enabled
        const fcmEnabled = userPrefs.fcmEnabled || false;
        const smsEnabled = userPrefs.smsReminderOn || false;
        const notificationFrequency = userPrefs.notificationFrequency || 'moderate';
        if (!fcmEnabled && !smsEnabled && !testMode) {
            return {
                success: false,
                method: 'none',
                message: 'All notification methods disabled',
                analytics: await buildAnalytics(userId, userProfile, userPrefs, 'none')
            };
        }
        // Calculate current hydration status
        const today = (0, date_fns_1.startOfDay)(new Date());
        const todayLogsSnapshot = await db.collection('hydration_logs')
            .where('userId', '==', userId)
            .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(today))
            .get();
        const currentMl = todayLogsSnapshot.docs.reduce((total, doc) => {
            return total + (doc.data().amount || 0);
        }, 0);
        const dailyGoalMl = userProfile.hydrationGoal || 2000;
        const hydrationPercentage = (currentMl / dailyGoalMl) * 100;
        // Get current streak
        const currentStreak = userPrefs.dailyStreak || 0;
        const userName = userProfile.name || 'there';
        const selectedTone = tone || userPrefs.motivationTone || 'kind';
        // Check if user should receive notification based on patterns
        if (!testMode && !shouldSendNotification(userPrefs, notificationFrequency, hydrationPercentage)) {
            return {
                success: false,
                method: 'none',
                message: 'Notification skipped due to frequency rules',
                analytics: await buildAnalytics(userId, userProfile, userPrefs, 'skipped')
            };
        }
        // Generate AI-powered motivational message using a simple fallback approach
        // Since we're inside a cloud function, we'll create the message directly
        let messageText = `💧 Hey ${userName}! You're at ${currentMl}/${dailyGoalMl}ml today. Time to hydrate! 🚰`;
        // Simple tone variations
        const toneMessages = {
            funny: `😂 ${userName}, your water bottle is starting to feel neglected! Show it some love? 💧`,
            kind: `😊 Gentle reminder, ${userName}: a sip of water now will keep you feeling great! 💧`,
            motivational: `💪 You've got this, ${userName}! ${currentMl}ml down, ${dailyGoalMl - currentMl}ml to go! 🚰`,
            sarcastic: `🙄 Oh look, ${userName}, your hydration goal is still waiting... how surprising 💧`,
            strict: `🧐 ${userName}, drink water. Now. Your body needs it. No excuses. 💧`,
            supportive: `🤗 Hey ${userName}, just checking in - how about some water to keep you amazing? 💧`,
            crass: `💥 Seriously ${userName}, your hydration game is weaker than decaf coffee! 💧`,
            weightloss: `🏋️‍♀️ Water boosts metabolism, ${userName}! Drink up for those weight goals! 💧`
        };
        messageText = toneMessages[selectedTone] || toneMessages.kind;
        // Determine delivery method
        let deliveryMethod = 'fcm';
        if (forceMethod !== 'auto') {
            deliveryMethod = forceMethod;
        }
        else if (fcmEnabled && smsEnabled) {
            // Prefer FCM but fallback to SMS if needed
            deliveryMethod = 'fcm';
        }
        else if (smsEnabled) {
            deliveryMethod = 'sms';
        }
        // Send notification(s)
        const results = await sendNotifications(userId, messageText, selectedTone, deliveryMethod, userPrefs, {
            currentMl,
            dailyGoalMl,
            percentage: hydrationPercentage,
            streak: currentStreak,
            vibrationEnabled: userPrefs.vibrationEnabled || true
        });
        // Log analytics
        await logReminderAnalytics(userId, {
            selectedTone,
            method: results.method,
            success: results.success,
            messageText,
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
    }
    catch (error) {
        console.error("Error sending hydration reminder:", error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
            success: false,
            method: 'none',
            message: `Failed to send reminder: ${errorMessage}`,
            error: errorMessage,
            analytics: await buildAnalytics(userId, {}, {}, 'error')
        };
    }
});
// Check if notification should be sent based on patterns and frequency
function shouldSendNotification(userPrefs, frequency, hydrationPercentage) {
    const lastNotificationTime = userPrefs.lastNotificationTime?.toDate();
    const now = new Date();
    if (!lastNotificationTime)
        return true; // First notification
    const minutesSinceLastNotification = (now.getTime() - lastNotificationTime.getTime()) / (1000 * 60);
    const intervals = FREQUENCY_INTERVALS[frequency] || FREQUENCY_INTERVALS.moderate;
    // Smart interval selection based on hydration status
    let targetInterval;
    if (hydrationPercentage < 25) {
        targetInterval = Math.min(...intervals); // More frequent if severely behind
    }
    else if (hydrationPercentage < 50) {
        targetInterval = intervals[Math.floor(intervals.length / 2)]; // Moderate if behind
    }
    else {
        targetInterval = Math.max(...intervals); // Less frequent if on track
    }
    // Add randomness for unpredictability
    const randomVariation = targetInterval * 0.2; // ±20% variation
    const randomOffset = (Math.random() - 0.5) * 2 * randomVariation;
    const finalInterval = targetInterval + randomOffset;
    return minutesSinceLastNotification >= finalInterval;
}
// Send notifications via FCM and/or SMS
async function sendNotifications(userId, messageText, tone, method, userPrefs, hydrationData) {
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
                const emoji = toneEmojis[tone] || '💧';
                const vibrationPattern = hydrationData.vibrationEnabled ? '200,100,200,100,200' : '';
                const fcmMessage = {
                    token: fcmToken,
                    notification: {
                        title: `${emoji} Water4WeightLoss`,
                        body: messageText
                    },
                    data: {
                        tone,
                        hydrationPercentage: hydrationData.percentage.toString(),
                        currentMl: hydrationData.currentMl.toString(),
                        goalMl: hydrationData.dailyGoalMl.toString(),
                        streak: hydrationData.streak.toString(),
                        vibrationPattern,
                        action: 'hydration_reminder',
                        url: '/dashboard?action=log-water'
                    },
                    android: {
                        priority: 'high',
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
                console.log(`FCM notification sent to user ${userId}`);
            }
        }
        catch (error) {
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
                console.log(`SMS notification sent to user ${userId}`);
            }
        }
        catch (error) {
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
    // Determine final result
    if (fcmSuccess && smsSuccess) {
        return { success: true, method: 'both' };
    }
    else if (fcmSuccess) {
        return { success: true, method: 'fcm' };
    }
    else if (smsSuccess) {
        return { success: true, method: 'sms' };
    }
    else {
        return { success: false, method: 'none', error: lastError };
    }
}
// Log analytics for reminder
async function logReminderAnalytics(userId, data) {
    try {
        await admin.firestore().collection('analytics_events').add({
            userId,
            type: 'hydration_reminder',
            ...data,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            platform: 'firebase_function'
        });
    }
    catch (error) {
        console.error('Failed to log reminder analytics:', error);
    }
}
// Build analytics object
async function buildAnalytics(userId, userProfile, userPrefs, method) {
    const today = (0, date_fns_1.startOfDay)(new Date());
    const db = admin.firestore();
    try {
        const todayLogsSnapshot = await db.collection('hydration_logs')
            .where('userId', '==', userId)
            .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(today))
            .get();
        const currentMl = todayLogsSnapshot.docs.reduce((total, doc) => {
            return total + (doc.data().amount || 0);
        }, 0);
        const goalMl = userProfile.hydrationGoal || 2000;
        const lastLogin = userProfile.lastLogin?.toDate() || new Date();
        const lastActiveHours = (new Date().getTime() - lastLogin.getTime()) / (1000 * 60 * 60);
        return {
            userId,
            tone: userPrefs.motivationTone || 'kind',
            deliveryMethod: method,
            hydrationStatus: {
                currentMl,
                goalMl,
                percentage: (currentMl / goalMl) * 100
            },
            streakDays: userPrefs.dailyStreak || 0,
            lastActiveHours: Math.round(lastActiveHours),
            timestamp: new Date().toISOString()
        };
    }
    catch (error) {
        console.error('Error building analytics:', error);
        return {
            userId,
            tone: 'unknown',
            deliveryMethod: method,
            hydrationStatus: { currentMl: 0, goalMl: 2000, percentage: 0 },
            streakDays: 0,
            lastActiveHours: 0,
            timestamp: new Date().toISOString()
        };
    }
}
//# sourceMappingURL=sendHydrationReminder.js.map