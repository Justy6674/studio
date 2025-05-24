/**
 * @fileOverview Firebase Function to fetch streak data (current and longest)
 * for the authenticated user.
 */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { formatISO, subDays, startOfDay, isSameDay } from 'date-fns';

export const getStreaks = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }
  const userId = context.auth.uid;
  const db = admin.firestore();

  try {
    const userDocRef = db.collection('users').doc(userId);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      // This might happen if a user is authenticated but their Firestore document hasn't been created yet.
      // Or if called before user profile creation is complete.
      console.warn(`User profile for ${userId} not found. Returning default streak data.`);
      return {
        dailyStreak: 0,
        longestStreak: 0,
        lastLogDate: null,
        message: "User profile not found, returning default streak data.",
      };
    }
    
    const userData = userDoc.data() as any; // Define UserProfile type if shared

    let dailyStreak = userData.dailyStreak || 0;
    const lastLogDateStr = userData.lastLogDate; // Should be YYYY-MM-DD string from formatISO(startOfDay(date))

    if (lastLogDateStr) {
        const today = formatISO(startOfDay(new Date()), { representation: 'date' });
        const yesterday = formatISO(subDays(startOfDay(new Date()), 1), { representation: 'date' });

        // If the last log date is not today and not yesterday, the streak is broken.
        // This check ensures that if a user misses a day, their streak is reset when this function is called.
        // The logHydration function also handles streak updates, but this provides a safety net.
        if (lastLogDateStr !== today && lastLogDateStr !== yesterday) {
            dailyStreak = 0;
            // Optionally, update Firestore here if streak is broken and hasn't been reset by logHydration.
            // This can make getStreaks more robust if logHydration had an issue or was missed.
            // await userDocRef.update({ dailyStreak: 0, lastUpdated: admin.firestore.FieldValue.serverTimestamp() });
            // For now, just returning the calculated 0. logHydration is the primary mutator.
        }
    } else {
        // No log date means no streak
        dailyStreak = 0;
    }

    return {
      dailyStreak: dailyStreak,
      longestStreak: userData.longestStreak || 0,
      lastLogDate: userData.lastLogDate || null, // lastLogDate is a YYYY-MM-DD string
    };
  } catch (error: any) {
    console.error('Error fetching streak data for user', userId, ':', error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to fetch streak data.', error.message);
  }
});
