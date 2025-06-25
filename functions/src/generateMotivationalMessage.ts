/**
 * @fileOverview Firebase Function to generate a hydration-based motivational
 * message using the Gemini API.
 */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, GenerativeModel } from '@google/generative-ai';
import { subDays, format, startOfDay } from 'date-fns';

let genAI: GoogleGenerativeAI | null = null;
let model: GenerativeModel | null = null;

// Initialize Gemini AI client
function initializeGenAI() {
  if (!genAI) {
    const API_KEY = functions.config().gemini?.apikey;
    if (!API_KEY) {
      console.error('Gemini API key not configured. Set with `firebase functions:config:set gemini.apikey=\"YOUR_KEY\"`');
      throw new functions.https.HttpsError('internal', 'AI service not configured. API key missing.');
    }
    genAI = new GoogleGenerativeAI(API_KEY);
    model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
  }
}

interface UserProfileData {
  hydrationGoal?: number;
  name?: string;
}

import { createAuthenticatedFunction } from "./types/firebase";

interface MotivationalMessageRequest {
  tone?: 'funny' | 'kind' | 'motivational' | 'sarcastic' | 'strict' | 'supportive' | 'crass' | 'weightloss';
  currentMl?: number;
  dailyGoalMl?: number;
  currentStreak?: number;
  userName?: string;
  name?: string;
}

interface MotivationalMessageResponse {
  message: string;
}

export const generateMotivationalMessage = createAuthenticatedFunction<MotivationalMessageRequest, MotivationalMessageResponse>(
  async (data, userId) => {
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
    const userData = userDoc.data() as UserProfileData;
    
    // Use request parameters or fallback to user profile/defaults
    const hydrationGoal = dailyGoalMl || userData.hydrationGoal || 2000;
    const userName = requestUserName || userData.name || 'there';
    const userTone = tone || 'kind'; // Default to kind tone
    
    // Get current hydration if not provided
    let currentHydration = currentMl;
    if (currentHydration === undefined) {
      // Calculate today's hydration
      const today = startOfDay(new Date());
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
    const twoDaysAgo = startOfDay(subDays(new Date(), 2));
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
        timestamp: format((d.timestamp as admin.firestore.Timestamp).toDate(), "MMM d, h:mm a")
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

  } catch (error: any) {
    console.error('Error generating motivational message for user', userId, ':', error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to generate motivational message.', error.message);
  }
});
