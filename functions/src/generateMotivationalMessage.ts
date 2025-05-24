/**
 * @fileOverview Firebase Function to generate a hydration-based motivational
 * message using the Gemini API.
 */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, GenerativeModel } from '@google/generative-ai';

let genAI: GoogleGenerativeAI | null = null;
let model: GenerativeModel | null = null;

function initializeGenAI() {
  if (!genAI) {
    const API_KEY = functions.config().gemini?.apikey;
    if (!API_KEY) {
      console.error('Gemini API key not configured. Set with `firebase functions:config:set gemini.apikey="YOUR_KEY"`');
      throw new functions.https.HttpsError('internal', 'AI service not configured. API key missing.');
    }
    genAI = new GoogleGenerativeAI(API_KEY);
    model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
  }
}

export const generateMotivationalMessage = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }
  const userId = context.auth.uid;
  const db = admin.firestore();

  initializeGenAI(); // Initialize on first call or if not already initialized
  if (!model) {
     throw new functions.https.HttpsError('internal', 'AI model not initialized.');
  }

  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User profile not found.');
    }
    const userData = userDoc.data() as any; // Define UserProfile type if shared
    const hydrationGoal = userData.hydrationGoal || 2000; // Default if not set

    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2); // Logs from the past 48 hours
    const logsSnapshot = await db.collection('hydration_logs')
      .where('userId', '==', userId)
      .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(twoDaysAgo))
      .orderBy('timestamp', 'desc')
      .limit(20) // Limit recent logs to keep prompt concise
      .get();
    
    const hydrationLogs = logsSnapshot.docs.map(doc => {
      const d = doc.data();
      return { 
        amount: d.amount, 
        timestamp: (d.timestamp as admin.firestore.Timestamp).toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      };
    });

    const logSummary = hydrationLogs.length > 0 
      ? `Recent logs: ${hydrationLogs.map(l => `${l.amount}ml at ${l.timestamp}`).join(', ')}.`
      : "No recent hydration logs found.";

    const prompt = `
      You are a friendly and supportive hydration coach.
      User ID: ${userId}
      User's daily hydration goal: ${hydrationGoal}ml.
      ${logSummary}
      
      Based on this information, write a short, kind, and encouraging SMS message (max 160 characters) 
      to motivate the user about their hydration. Be positive and avoid shaming. 
      If they have logs, acknowledge their effort. If not, gently encourage them to log.
      Make the message feel personal and helpful.
    `;

    const generationConfig = {
      temperature: 0.8, // Slightly creative but not too wild
      topK: 1,
      topP: 0.95,
      maxOutputTokens: 80, // Max chars for SMS is around 160, this gives buffer
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
    if (!response || !response.candidates || response.candidates.length === 0) {
      console.error('Gemini API returned no candidates. Response:', JSON.stringify(response, null, 2));
      throw new functions.https.HttpsError('internal', 'AI service did not return a valid response.');
    }
    
    const messageText = response.text();
    if (!messageText) {
       console.error('Gemini API returned empty text. Response:', JSON.stringify(response, null, 2));
       throw new functions.https.HttpsError('internal', 'AI service returned an empty message.');
    }
    
    return { message: messageText.trim() };

  } catch (error: any) {
    console.error('Error generating motivational message for user', userId, ':', error);
    if (error.response && error.response.promptFeedback) {
      console.error('Gemini Prompt Feedback:', JSON.stringify(error.response.promptFeedback, null, 2));
       throw new functions.https.HttpsError('internal', `AI service failed due to content policy: ${error.response.promptFeedback.blockReason}`);
    }
    throw new functions.https.HttpsError('internal', 'Failed to generate motivational message.');
  }
});
