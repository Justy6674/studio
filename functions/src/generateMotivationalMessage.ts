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
      console.error('Gemini API key not configured. Set with `firebase functions:config:set gemini.apikey="YOUR_KEY"`');
      throw new functions.https.HttpsError('internal', 'AI service not configured. API key missing.');
    }
    genAI = new GoogleGenerativeAI(API_KEY);
    // Specify the model; ensure it's one available for your key and project
    model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
  }
}

export const generateMotivationalMessage = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }
  const userId = context.auth.uid;
  const db = admin.firestore();

  initializeGenAI(); // Initialize client, will only run once
  if (!model) {
     throw new functions.https.HttpsError('internal', 'AI model not initialized. Check API key configuration.');
  }

  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User profile not found.');
    }
    const userData = userDoc.data() as any; // Define UserProfile type if shared
    const hydrationGoal = userData.hydrationGoal || 2000; // Default if not set
    const userName = userData.name || 'there';

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
        // Format timestamp for better readability in the prompt
        timestamp: format((d.timestamp as admin.firestore.Timestamp).toDate(), "MMM d, h:mm a")
      };
    });

    const logSummary = hydrationLogsFormatted.length > 0 
      ? `Their recent logs: ${hydrationLogsFormatted.map(l => `${l.amount}ml at ${l.timestamp}`).join('; ')}.`
      : "They have no recent hydration logs in the last 48 hours.";

    const prompt = `
      You are a friendly and supportive hydration coach named HydroHelper.
      The user's name is ${userName}.
      Their daily hydration goal is ${hydrationGoal}ml.
      ${logSummary}
      
      Based on this information, write a short (around 1-2 sentences, max 160 characters for SMS compatibility), kind, and encouraging message 
      to motivate the user about their hydration. Be positive and avoid shaming.
      If they have logs, acknowledge their effort. If not, gently encourage them to log their intake.
      Make the message feel personal, empathetic, and helpful. Address them by their name.
      End with a water-related emoji.
    `;

    const generationConfig = {
      temperature: 0.7, 
      topK: 1,
      topP: 1,
      maxOutputTokens: 80, // Max tokens for a short SMS-like message
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

    // Access the response text correctly
    const response = result.response;
    if (!response || !response.candidates || response.candidates.length === 0 || !response.text()) {
      console.error('Gemini API returned no valid candidates or text. Response:', JSON.stringify(response, null, 2));
      throw new functions.https.HttpsError('internal', 'AI service did not return a valid response.');
    }
    
    const messageText = response.text().trim();
    
    return { message: messageText };

  } catch (error: any) {
    console.error('Error generating motivational message for user', userId, ':', error);
    // Check for specific Gemini API error details if available
    if (error.response?.promptFeedback?.blockReason) {
      console.error('Gemini Prompt Feedback:', JSON.stringify(error.response.promptFeedback, null, 2));
       throw new functions.https.HttpsError('internal', `AI service failed due to content policy: ${error.response.promptFeedback.blockReasonMessage || error.response.promptFeedback.blockReason}`);
    }
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to generate motivational message.', error.message);
  }
});
