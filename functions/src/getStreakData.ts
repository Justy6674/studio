/**
 * @fileOverview Firebase Function to fetch streak data (current and longest)
 * for the authenticated user.
 */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const getStreakData = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }
  const userId = context.auth.uid;
  const db = admin.firestore();

  try {
    const userDocRef = db.collection('users').doc(userId);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      // It's possible a user exists in Auth but not yet in Firestore if sign-up process was interrupted.
      // Or, if this function is called before user profile is fully created.
      // Returning default streak data or throwing an error are options.
      console.warn(`User profile for ${userId} not found.`);
      return {
        dailyStreak: 0,
        longestStreak: 0,
        message: "User profile not found, returning default streak data.",
      };
      // throw new functions.https.HttpsError('not-found', 'User profile not found.');
    }
    
    const userData = userDoc.data() as any; // Define UserProfile type if shared

    // Optional: Recalculate current streak if lastLogDate is too old (e.g., > 1 day ago from yesterday)
    // This ensures streak is accurate even if a logHydration call was missed or failed.
    // For simplicity, this example returns stored values. A more robust version might check lastLogDate.

    return {
      dailyStreak: userData.dailyStreak || 0,
      longestStreak: userData.longestStreak || 0,
      lastLogDate: userData.lastLogDate || null,
    };
  } catch (error) {
    console.error('Error fetching streak data for user', userId, ':', error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to fetch streak data.');
  }
});
