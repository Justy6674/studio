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
exports.generateMotivationalMessage = void 0;
/**
 * @fileOverview Firebase Function to generate a hydration-based motivational
 * message using the Gemini API.
 */
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const generative_ai_1 = require("@google/generative-ai");
const date_fns_1 = require("date-fns");
let genAI = null;
let model = null;
// Initialize Gemini AI client
function initializeGenAI() {
    if (!genAI) {
        const API_KEY = functions.config().gemini?.apikey;
        if (!API_KEY) {
            console.error('Gemini API key not configured. Set with `firebase functions:config:set gemini.apikey=\"YOUR_KEY\"`');
            throw new functions.https.HttpsError('internal', 'AI service not configured. API key missing.');
        }
        genAI = new generative_ai_1.GoogleGenerativeAI(API_KEY);
        model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    }
}
const firebase_1 = require("./types/firebase");
exports.generateMotivationalMessage = (0, firebase_1.createAuthenticatedFunction)(async (data, userId) => {
    const db = admin.firestore();
    initializeGenAI();
    if (!model) { // Check if model was successfully initialized
        throw new functions.https.HttpsError('failed-precondition', 'AI model not initialized. Check API key configuration.');
    }
    try {
        // Get parameters from request or fetch from user profile
        const { tone, currentMl, dailyGoalMl, currentStreak, userName: requestUserName } = data;
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'User profile not found.');
        }
        const userData = userDoc.data();
        // Use request parameters or fallback to user profile/defaults
        const hydrationGoal = dailyGoalMl || userData.hydrationGoal || 2000;
        const userName = requestUserName || userData.name || 'there';
        const userTone = tone || 'kind'; // Default to kind tone
        // Get current hydration if not provided
        let currentHydration = currentMl;
        if (currentHydration === undefined) {
            // Calculate today's hydration
            const today = (0, date_fns_1.startOfDay)(new Date());
            const todayLogsSnapshot = await db.collection('hydration_logs')
                .where('userId', '==', userId)
                .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(today))
                .get();
            currentHydration = todayLogsSnapshot.docs.reduce((total, doc) => {
                return total + (doc.data().amount || 0);
            }, 0);
        }
        // Get current streak if not provided
        let streak = currentStreak;
        if (streak === undefined) {
            // Calculate streak (simplified version)
            const userPrefsDoc = await db.collection('user_preferences').doc(userId).get();
            const userPrefs = userPrefsDoc.exists ? userPrefsDoc.data() : null;
            streak = userPrefs?.dailyStreak || 0;
        }
        // Fetch logs from the past 48 hours
        const twoDaysAgo = (0, date_fns_1.startOfDay)((0, date_fns_1.subDays)(new Date(), 2));
        const logsSnapshot = await db.collection('hydration_logs')
            .where('userId', '==', userId)
            .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(twoDaysAgo))
            .orderBy('timestamp', 'desc')
            .limit(10) // Limit recent logs to keep prompt concise and relevant
            .get();
        const hydrationLogsFormatted = logsSnapshot.docs.map(doc => {
            const d = doc.data();
            return {
                amount: d.amount,
                timestamp: (0, date_fns_1.format)(d.timestamp.toDate(), "MMM d, h:mm a")
            };
        });
        const logSummary = hydrationLogsFormatted.length > 0
            ? `Their recent logs: ${hydrationLogsFormatted.map(l => `${l.amount}ml at ${l.timestamp}`).join('; ')}.`
            : "They have no recent hydration logs in the last 48 hours.";
        // EXACT PROMPT PATTERN AS REQUIRED
        const prompt = `
Generate a short, ${userTone}-toned push notification encouraging ${userName} to hydrate right now.
User consumed: ${currentHydration}/${hydrationGoal} ml today.
Current streak: ${streak} days.
Ensure each message is unique, engaging, and NEVER repetitive.

Additional context: ${logSummary}

Requirements:
- Maximum 160 characters for mobile notifications
- Match the ${userTone} tone exactly
- Be creative and unpredictable
- Include relevant emoji
- Address user as ${userName}
- Focus on immediate hydration action
    `;
        const generationConfig = {
            temperature: 0.7,
            topK: 1,
            topP: 1,
            maxOutputTokens: 80,
        };
        const safetySettings = [
            { category: generative_ai_1.HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: generative_ai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: generative_ai_1.HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: generative_ai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: generative_ai_1.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: generative_ai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: generative_ai_1.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: generative_ai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        ];
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig,
            safetySettings,
        });
        const response = result.response;
        const responseText = response.text(); // Call text() method
        if (!responseText) {
            console.error('Gemini API returned no valid text. Response:', JSON.stringify(response, null, 2));
            // Check for blocking reasons
            if (response.promptFeedback?.blockReason) {
                throw new functions.https.HttpsError('internal', `AI service blocked the prompt: ${response.promptFeedback.blockReasonMessage || response.promptFeedback.blockReason}`);
            }
            throw new functions.https.HttpsError('internal', 'AI service did not return a valid response text.');
        }
        const messageText = responseText.trim();
        return { message: messageText };
    }
    catch (error) {
        console.error('Error generating motivational message for user', userId, ':', error);
        if (error instanceof functions.https.HttpsError)
            throw error;
        throw new functions.https.HttpsError('internal', 'Failed to generate motivational message.', error.message);
    }
});
//# sourceMappingURL=generateMotivationalMessage.js.map