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
exports.getHydrationMotivation = void 0;
/**
 * @fileOverview Firebase Function to generate a hydration-based motivational
 * message using the Gemini API, tailored to a user-selected tone.
 */
const functions = __importStar(require("firebase-functions"));
const generative_ai_1 = require("@google/generative-ai");
const date_fns_1 = require("date-fns");
let genAI = null;
let model = null;
// Initialize Gemini AI client
function initializeGenAI() {
    if (!genAI) {
        const API_KEY = functions.config().gemini?.apikey; // Using existing gemini.apikey config
        if (!API_KEY) {
            console.error('Gemini API key not configured. Set with `firebase functions:config:set gemini.apikey="YOUR_KEY"`');
            throw new functions.https.HttpsError('failed-precondition', 'AI service not configured. API key missing.');
        }
        genAI = new generative_ai_1.GoogleGenerativeAI(API_KEY);
        model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    }
}
exports.getHydrationMotivation = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    // const userId = context.auth.uid; // Not strictly needed for this function if all data is passed
    initializeGenAI();
    if (!model) {
        throw new functions.https.HttpsError('failed-precondition', 'AI model not initialized. Check API key configuration.');
    }
    const { tone, userName = 'User', hydrationGoal = 2000, recentLogs = [] } = data;
    try {
        const logSummary = recentLogs.length > 0
            ? `Their recent logs include: ${recentLogs.slice(0, 3).map(l => `${l.amount}ml around ${(0, date_fns_1.format)(new Date(l.timestamp), "MMM d, h:mm a")}`).join('; ')}.`
            : "They have no very recent hydration logs provided.";
        const prompt = `
      You are a hydration coach for the app Water4WeightLoss.
      The user's name is ${userName}.
      Their daily hydration goal is ${hydrationGoal}ml.
      ${logSummary}
      
      The user wants a motivational message in a "${tone}" tone.
      
      Based on this information, write a short (1-2 sentences, max 160 characters for SMS compatibility if needed, but primarily for in-app display),
      hydration-focused message in the specified "${tone}" tone.
      Be creative and stick to the requested tone.
      If the tone is "clinical", be factual and informative.
      If the tone is "rude" or "crass", be edgy but avoid actual harmful content.
      If the tone is "funny" or "sarcastic", make it lighthearted.
      If the tone is "kind" or "motivational" or "default", be positive and encouraging.
      End with a relevant emoji if appropriate for the tone.
    `;
        const generationConfig = {
            temperature: 0.8, // Slightly higher for more creative/varied tones
            topK: 1,
            topP: 1,
            maxOutputTokens: 100,
        };
        const safetySettings = [
            // Adjust safety settings if needed, especially for "rude" or "crass" tones, but be mindful of API limits
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
        return { message: responseText.trim() };
    }
    catch (error) {
        console.error('Error generating hydration motivation:', error);
        if (error instanceof functions.https.HttpsError)
            throw error;
        throw new functions.https.HttpsError('internal', 'Failed to generate hydration motivation.', error.message);
    }
});
//# sourceMappingURL=getHydrationMotivation.js.map