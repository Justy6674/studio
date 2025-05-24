/**
 * @fileOverview Firebase Function to fetch streak data (current and longest)
 * for the authenticated user.
 */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { formatISO, subDays, startOfDay } from 'date-fns';

interface UserProfileData {
  dailyStreak?: number;
  longestStreak?: number;
  lastLogDate?: string; // YYYY-MM-DD
}

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
      console.warn(`User profile for ${userId} not found. Returning default streak data.`);
      return {
        dailyStreak: 0,
        longestStreak: 0,
        lastLogDate: null,
        message: "User profile not found, returning default streak data.",
      };
    }
    
    const userData = userDoc.data() as UserProfileData;

    let dailyStreak = userData.dailyStreak || 0;
    const lastLogDateStr = userData.lastLogDate; // Should be YYYY-MM-DD string

    if (lastLogDateStr) {
        const todayDate = startOfDay(new Date());
        const today = formatISO(todayDate, { representation: 'date' });
        const yesterdayDate = subDays(todayDate, 1);
        const yesterday = formatISO(yesterdayDate, { representation: 'date' });

        // If the last log date is not today and not yesterday, the streak is broken.
        if (lastLogDateStr !== today && lastLogDateStr !== yesterday) {
            dailyStreak = 0;
            // Note: This function primarily reads. Streak resets are mainly handled by logHydration.
            // If strictness is required here, an update could be performed, but it's often better
            // for the action (logging) to be the source of truth for mutations.
        }
    } else {
        // No log date means no streak
        dailyStreak = 0;
    }

    return {
      dailyStreak: dailyStreak,
      longestStreak: userData.longestStreak || 0,
      lastLogDate: userData.lastLogDate || null, 
    };
  } catch (error: any) {
    console.error('Error fetching streak data for user', userId, ':', error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to fetch streak data.', error.message);
  }
});
