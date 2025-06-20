/**
 * @fileOverview Firebase Function to fetch streak data (current and longest)
 * for the authenticated user.
 */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { formatISO, subDays, isSameDay } from 'date-fns';
import { createAuthenticatedFunction } from './types/firebase';

interface StreakDataRequest {
  // No specific request parameters needed
}

interface StreakDataResponse {
  dailyStreak: number;
  longestStreak: number;
  lastLogDate: string | null;
  message?: string;
}

export const getStreakData = createAuthenticatedFunction<StreakDataRequest, StreakDataResponse>(
  async (data, userId) => {
  const db = admin.firestore();

  try {
    const userDocRef = db.collection('users').doc(userId);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      console.warn(`User profile for ${userId} not found. Returning default streak data.`);
      // It's possible a user exists in Auth but not yet in Firestore if sign-up process was interrupted.
      // Or, if this function is called before user profile is fully created.
      return {
        dailyStreak: 0,
        longestStreak: 0,
        lastLogDate: null,
        message: "User profile not found, returning default streak data.",
      };
    }
    
    const userData = userDoc.data() as any; // Define UserProfile type if shared

    let dailyStreak = userData.dailyStreak || 0;
    const lastLogDateStr = userData.lastLogDate; // Should be YYYY-MM-DD string

    if (lastLogDateStr) {
        const today = formatISO(new Date(), { representation: 'date' });
        const yesterday = formatISO(subDays(new Date(), 1), { representation: 'date' });

        // If the last log date is not today and not yesterday, the streak is broken.
        if (lastLogDateStr !== today && lastLogDateStr !== yesterday) {
            dailyStreak = 0;
            // Optionally, update Firestore if streak is broken and hasn't been reset by a log operation.
            // This makes getStreakData more robust if logHydration failed or was missed.
            // await userDocRef.update({ dailyStreak: 0 });
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
