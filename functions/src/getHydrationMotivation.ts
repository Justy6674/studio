
/**
 * @fileOverview Firebase Function to generate a hydration-based motivational
 * message using the Gemini API, tailored to a user-selected tone.
 */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, GenerativeModel } from '@google/generative-ai';
import { subDays, format, startOfDay } from 'date-fns';
import type { MotivationTone } from '../../src/lib/types'; // Adjust path as needed

let genAI: GoogleGenerativeAI | null = null;
let model: GenerativeModel | null = null;

// Initialize Gemini AI client
function initializeGenAI() {
  if (!genAI) {
    const API_KEY = functions.config().gemini?.apikey; // Using existing gemini.apikey config
    if (!API_KEY) {
      console.error('Gemini API key not configured. Set with `firebase functions:config:set gemini.apikey="YOUR_KEY"`');
      throw new functions.https.HttpsError('failed-precondition', 'AI service not configured. API key missing.');
    }
    genAI = new GoogleGenerativeAI(API_KEY);
    model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
  }
}

interface HydrationData {
    amount: number;
    timestamp: string; // ISO string
}

interface GetHydrationMotivationData {
  tone: MotivationTone;
  userName?: string;
  hydrationGoal?: number;
  recentLogs?: HydrationData[]; // Optional recent logs for context
}

export const getHydrationMotivation = functions.https.onCall(async (data: GetHydrationMotivationData, context) => {
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
      ? `Their recent logs include: ${recentLogs.slice(0, 3).map(l => `${l.amount}ml around ${format(new Date(l.timestamp), "MMM d, h:mm a")}`).join('; ')}.`
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
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ];

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{text: prompt}] }],
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

  } catch (error: any) {
    console.error('Error generating hydration motivation:', error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to generate hydration motivation.', error.message);
  }
});
