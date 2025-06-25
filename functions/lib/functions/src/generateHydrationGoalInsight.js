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
exports.generateHydrationGoalInsight = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const generative_ai_1 = require("@google/generative-ai");
const date_fns_1 = require("date-fns");
const firebase_1 = require("./types/firebase");
if (!admin.apps.length) {
    admin.initializeApp();
}
let genAI = null;
let model = null;
// Initialize Gemini AI client
function initializeGenAI() {
    if (!genAI) {
        const API_KEY = functions.config().gemini?.apikey;
        if (!API_KEY) {
            console.error('Gemini API key not configured. Set with `firebase functions:config:set gemini.apikey="YOUR_KEY"`');
            throw new functions.https.HttpsError('internal', 'AI service not configured. API key missing.');
        }
        genAI = new generative_ai_1.GoogleGenerativeAI(API_KEY);
        model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    }
}
exports.generateHydrationGoalInsight = (0, firebase_1.createAuthenticatedFunction)(async (data, userId) => {
    const { hydrationPattern, weekStart } = data;
    if (!hydrationPattern || !Array.isArray(hydrationPattern) || hydrationPattern.length !== 7) {
        throw new functions.https.HttpsError('invalid-argument', 'hydrationPattern must be an array of 7 numbers (one for each day of the week)');
    }
    if (!weekStart) {
        throw new functions.https.HttpsError('invalid-argument', 'weekStart date is required');
    }
    const db = admin.firestore();
    initializeGenAI();
    if (!model) {
        throw new functions.https.HttpsError('failed-precondition', 'AI model not initialized. Check API key configuration.');
    }
    try {
        // Get user profile data
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'User profile not found.');
        }
        const userData = userDoc.data();
        const hydrationGoal = userData.hydrationGoal || 2000; // Default if not set
        const userName = userData.name || 'there';
        // Calculate weekly statistics
        const totalWeeklyIntake = hydrationPattern.reduce((sum, daily) => sum + daily, 0);
        const averageDailyIntake = Math.round(totalWeeklyIntake / 7);
        const daysMetGoal = hydrationPattern.filter(daily => daily >= hydrationGoal).length;
        const highestDay = Math.max(...hydrationPattern);
        const lowestDay = Math.min(...hydrationPattern);
        // Find patterns
        const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const bestDayIndex = hydrationPattern.indexOf(highestDay);
        const worstDayIndex = hydrationPattern.indexOf(lowestDay);
        const bestDay = weekDays[bestDayIndex];
        const worstDay = weekDays[worstDayIndex];
        // Create weekly pattern summary
        const weeklyPatternText = hydrationPattern
            .map((amount, index) => `${weekDays[index]}: ${amount}ml`)
            .join(', ');
        const weekStartDate = new Date(weekStart);
        const weekEndDate = (0, date_fns_1.addDays)(weekStartDate, 6);
        const weekRange = `${(0, date_fns_1.format)(weekStartDate, 'MMM d')} - ${(0, date_fns_1.format)(weekEndDate, 'MMM d')}`;
        const prompt = `
      You are HydroHelper, an AI hydration coach for the Water4WeightLoss app.
      
      User: ${userName}
      Week: ${weekRange}
      Daily Goal: ${hydrationGoal}ml
      
      Weekly Hydration Pattern:
      ${weeklyPatternText}
      
      Summary:
      - Total weekly intake: ${totalWeeklyIntake}ml
      - Daily average: ${averageDailyIntake}ml
      - Days goal met: ${daysMetGoal}/7
      - Best day: ${bestDay} (${highestDay}ml)
      - Challenging day: ${worstDay} (${lowestDay}ml)
      
      Write a personalised, encouraging weekly insight (2-3 sentences) that:
      1. Acknowledges their progress positively
      2. Identifies one specific pattern or trend from their data
      3. Gives one actionable tip for the upcoming week
      4. Mentions weight loss benefits of proper hydration
      5. Uses their name and Australian spelling/phrases
      
      Keep it motivational, specific to their data, and under 200 characters for mobile display.
      End with a water-related emoji.
    `;
        const generationConfig = {
            temperature: 0.8,
            topK: 1,
            topP: 1,
            maxOutputTokens: 120,
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
        const responseText = response.text();
        if (!responseText) {
            console.error('Gemini API returned no valid text. Response:', JSON.stringify(response, null, 2));
            if (response.promptFeedback?.blockReason) {
                throw new functions.https.HttpsError('internal', `AI service blocked the prompt: ${response.promptFeedback.blockReasonMessage || response.promptFeedback.blockReason}`);
            }
            throw new functions.https.HttpsError('internal', 'AI service did not return a valid response text.');
        }
        const insightText = responseText.trim();
        // Log the insight generation for analytics
        await db.collection('analytics_events').add({
            userId,
            type: 'insight_generated',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            metadata: {
                weekStart,
                averageDailyIntake,
                daysMetGoal,
                totalWeeklyIntake
            }
        });
        // Generate recommendations based on hydration pattern
        const recommendations = [
            lowestDay < hydrationGoal ? `Try to increase your intake on ${worstDay}s` : 'Keep up your consistent hydration throughout the week',
            averageDailyIntake < hydrationGoal ? 'Set reminders to drink water throughout the day' : 'Continue your excellent hydration habits'
        ];
        return {
            insight: insightText,
            recommendations
        };
    }
    catch (error) {
        console.error('Error generating hydration goal insight for user', userId, ':', error);
        if (error instanceof functions.https.HttpsError)
            throw error;
        throw new functions.https.HttpsError('internal', 'Failed to generate hydration insight.', error.message);
    }
});
//# sourceMappingURL=generateHydrationGoalInsight.js.map