import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, GenerativeModel } from '@google/generative-ai';
import { format, startOfWeek, addDays } from 'date-fns';

if (!admin.apps.length) {
  admin.initializeApp();
}

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
    model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
  }
}

interface UserProfileData {
  hydrationGoal?: number;
  name?: string;
}

export const generateHydrationGoalInsight = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const userId = context.auth.uid;
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
    
    const userData = userDoc.data() as UserProfileData;
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
    const weekEndDate = addDays(weekStartDate, 6);
    const weekRange = `${format(weekStartDate, 'MMM d')} - ${format(weekEndDate, 'MMM d')}`;

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

    return { insight: insightText };

  } catch (error: any) {
    console.error('Error generating hydration goal insight for user', userId, ':', error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to generate hydration insight.', error.message);
  }
}); 