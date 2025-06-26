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
exports.processScheduledNotifications = void 0;
/**
 * @fileOverview Firebase Function to process scheduled notifications
 * and send them via FCM with Gemini AI generated messages
 */
const scheduler_1 = require("firebase-functions/v2/scheduler");
const admin = __importStar(require("firebase-admin"));
const generative_ai_1 = require("@google/generative-ai");
let genAI = null;
// Initialize Gemini AI client
function initializeGenAI() {
    if (!genAI) {
        const API_KEY = process.env.GEMINI_API_KEY;
        if (!API_KEY) {
            console.error('Gemini API key not configured');
            throw new Error('AI service not configured');
        }
        genAI = new generative_ai_1.GoogleGenerativeAI(API_KEY);
    }
}
exports.processScheduledNotifications = (0, scheduler_1.onSchedule)({ schedule: 'every 5 minutes', timeoutSeconds: 540 }, async () => {
    const db = admin.firestore();
    initializeGenAI();
    try {
        // Get notifications that are due to be sent
        const now = admin.firestore.Timestamp.now();
        const notificationsQuery = await db.collection('scheduled_notifications')
            .where('scheduledFor', '<=', now)
            .where('processed', '!=', true)
            .limit(50) // Process max 50 at a time
            .get();
        if (notificationsQuery.empty) {
            console.log('No scheduled notifications to process');
            return;
        }
        console.log(`Processing ${notificationsQuery.size} scheduled notifications`);
        const promises = notificationsQuery.docs.map(async (doc) => {
            const notification = doc.data();
            try {
                await processNotification(notification, doc.id);
                // Mark as processed
                await doc.ref.update({
                    processed: true,
                    processedAt: admin.firestore.Timestamp.now()
                });
                console.log(`Processed notification ${doc.id} for user ${notification.userId}`);
            }
            catch (error) {
                console.error(`Failed to process notification ${doc.id}:`, error);
                // Mark as failed but don't retry immediately
                await doc.ref.update({
                    failed: true,
                    failedAt: admin.firestore.Timestamp.now(),
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
        await Promise.all(promises);
        console.log('Finished processing scheduled notifications');
    }
    catch (error) {
        console.error('Error processing scheduled notifications:', error);
        throw error;
    }
});
async function processNotification(notification, notificationId) {
    const db = admin.firestore();
    // Get user FCM token
    const tokenDoc = await db.collection('fcm_tokens').doc(notification.userId).get();
    if (!tokenDoc.exists) {
        console.log(`No FCM token found for user ${notification.userId}`);
        return;
    }
    const tokenData = tokenDoc.data();
    const fcmToken = tokenData?.token;
    if (!fcmToken) {
        console.log(`Invalid FCM token for user ${notification.userId}`);
        return;
    }
    // Get user preferences for vibration and other settings
    const prefsDoc = await db.collection('user_preferences').doc(notification.userId).get();
    const prefs = prefsDoc.exists ? prefsDoc.data() : null;
    // Generate personalized message using Gemini AI
    const message = await generateNotificationMessage(notification);
    // Prepare FCM message
    const fcmMessage = {
        token: fcmToken,
        notification: {
            title: getNotificationTitle(notification.type),
            body: message,
        },
        data: {
            type: notification.type,
            tone: notification.tone,
            currentMl: notification.currentMl.toString(),
            goalMl: notification.goalMl.toString(),
            notificationId,
            vibrationPattern: prefs?.vibrationEnabled ? getVibrationPattern(prefs.vibrationIntensity) : '',
        },
        android: {
            priority: 'high',
            notification: {
                icon: 'ic_notification',
                color: '#3B82F6',
                channelId: 'hydration_reminders',
                tag: notification.type,
            },
        },
        apns: {
            payload: {
                aps: {
                    alert: {
                        title: getNotificationTitle(notification.type),
                        body: message,
                    },
                    sound: 'default',
                    badge: 1,
                },
            },
        },
        webpush: {
            notification: {
                title: getNotificationTitle(notification.type),
                body: message,
                icon: '/logo-192.png',
                badge: '/logo-192.png',
                vibrate: prefs?.vibrationEnabled ? getVibrationPattern(prefs.vibrationIntensity).split(',').map(Number) : undefined,
                data: {
                    url: '/dashboard',
                },
            },
        },
    };
    // Send FCM notification
    try {
        const response = await admin.messaging().send(fcmMessage);
        console.log(`FCM notification sent successfully: ${response}`);
        // Log analytics event
        await db.collection('analytics_events').add({
            userId: notification.userId,
            eventType: 'notification_sent',
            data: {
                notificationType: notification.type,
                tone: notification.tone,
                messageLength: message.length,
                fcmResponse: response,
            },
            timestamp: admin.firestore.Timestamp.now(),
            source: 'scheduled_notifications'
        });
    }
    catch (error) {
        console.error('Failed to send FCM notification:', error);
        throw error;
    }
}
async function generateNotificationMessage(notification) {
    if (!genAI) {
        return getFallbackMessage(notification);
    }
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
        const progressPercent = Math.round((notification.currentMl / notification.goalMl) * 100);
        const prompt = `Generate a short, ${notification.tone}-toned hydration reminder notification.
    
Current progress: ${notification.currentMl}ml / ${notification.goalMl}ml (${progressPercent}%)
Type: ${notification.type}
Time: ${new Date().toLocaleString()}

Requirements:
- Maximum 120 characters for mobile notifications
- Match the ${notification.tone} tone exactly
- Be encouraging and motivating
- Include relevant emoji
- Focus on immediate hydration action
- Be unique and engaging

Generate ONE motivational message now:`;
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.8,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 50,
            },
            safetySettings: [
                { category: generative_ai_1.HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: generative_ai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: generative_ai_1.HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: generative_ai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: generative_ai_1.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: generative_ai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: generative_ai_1.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: generative_ai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            ],
        });
        const response = result.response;
        const messageText = response.text();
        if (messageText && messageText.trim().length > 0) {
            return messageText.trim();
        }
    }
    catch (error) {
        console.error('Gemini AI error, using fallback:', error);
    }
    return getFallbackMessage(notification);
}
function getFallbackMessage(notification) {
    const progressPercent = Math.round((notification.currentMl / notification.goalMl) * 100);
    const messages = {
        funny: [
            `Your water bottle is feeling neglected! ${notification.currentMl}ml down, keep going! 💧😄`,
            `H2-Oh no! Time for more water! You're at ${progressPercent}% 🚰`,
            `Your cells are sending thirsty texts! Hydrate now! 💦📱`,
        ],
        kind: [
            `Gentle reminder to hydrate! You're doing great at ${progressPercent}% 💙`,
            `Your body will thank you for another glass of water 🌟`,
            `Every sip counts! Keep up the good work 💧`,
        ],
        motivational: [
            `Power up with H2O! You're ${progressPercent}% to your goal! 💪`,
            `Champions hydrate! Keep pushing forward! 🏆`,
            `Fuel your success with water! You've got this! 🚀`,
        ],
        sarcastic: [
            `Oh look, your water goal is still waiting... ${progressPercent}% done 🙄`,
            `Shocking news: your body still needs water! Who knew? 💧`,
            `Your hydration game could use some work... just saying 😏`,
        ],
        strict: [
            `Drink water. Now. No excuses. ${progressPercent}% completed. 🧐`,
            `Hydration is not optional. Get back to it! 💪`,
            `Your goal won't reach itself. Drink up! 🚰`,
        ],
        supportive: [
            `You're doing amazing! Time for some self-care hydration 🤗`,
            `I believe in you! Another glass will get you closer 💕`,
            `You've got this! Your health journey continues with water 🌈`,
        ],
        crass: [
            `Seriously, drink some bloody water! ${progressPercent}% ain't enough! 💥`,
            `Your hydration game is weak! Step it up! 🔥`,
            `Stop making excuses and chug that H2O! 💪`,
        ],
        weightloss: [
            `Water boosts metabolism! Drink up for those weight goals! 🏋️‍♀️`,
            `Every glass burns calories and flushes toxins! Keep going! 🔥`,
            `Hydration = weight loss success! You're ${progressPercent}% there! 💪`,
        ],
    };
    const toneMessages = messages[notification.tone] || messages.kind;
    return toneMessages[Math.floor(Math.random() * toneMessages.length)];
}
function getNotificationTitle(type) {
    switch (type) {
        case 'hydration_reminder':
            return 'Time to Hydrate! 💧';
        case 'achievement':
            return 'Achievement Unlocked! 🏆';
        case 'streak_reminder':
            return 'Keep Your Streak! 🔥';
        default:
            return 'Water4WeightLoss';
    }
}
function getVibrationPattern(intensity) {
    switch (intensity) {
        case 'light':
            return '100,50,100';
        case 'heavy':
            return '300,100,300,100,300';
        case 'medium':
        default:
            return '200,100,200';
    }
}
//# sourceMappingURL=processScheduledNotifications.js.map