/**
 * @fileOverview Firebase Function to log hydration for an authenticated user
 * and update their streak data.
 */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { formatISO, subDays, startOfDay } from 'date-fns';

interface LogHydrationData {
  amount: number;
  timestamp?: string; // Optional: client can send ISO string
}

interface UserProfileData {
  dailyStreak?: number;
  longestStreak?: number;
  lastLogDate?: string; // YYYY-MM-DD
  name?: string;
  email?: string | null;
  hydrationGoal?: number;
  reminderTimes?: { [key: string]: boolean };
}

export const logHydration = functions.https.onCall(async (data: LogHydrationData, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }
  const userId = context.auth.uid;
  const { amount, timestamp: clientTimestamp } = data;

  if (typeof amount !== 'number' || amount <= 0) {
    throw new functions.https.HttpsError('invalid-argument', 'The function must be called with a valid "amount" (number > 0).');
  }

  const db = admin.firestore();

  try {
    let logTimestampValue: admin.firestore.Timestamp | admin.firestore.FieldValue = admin.firestore.FieldValue.serverTimestamp();
    if (clientTimestamp) {
      const parsedDate = new Date(clientTimestamp);
      if (!isNaN(parsedDate.getTime())) {
        logTimestampValue = admin.firestore.Timestamp.fromDate(parsedDate);
      } else {
        console.warn(`Invalid client timestamp string received: ${clientTimestamp}. Falling back to server timestamp.`);
      }
    }
    
    const logRef = await db.collection('hydration_logs').add({
      userId,
      amount,
      timestamp: logTimestampValue,
    });

    // Update streak data
    const userDocRef = db.collection('users').doc(userId);
    
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userDocRef);
      
      let dailyStreak = 0;
      let longestStreak = 0;
      let lastLogDateStr: string | null = null;

      // Ensure date comparison is done with start of day for consistency
      const todayDate = startOfDay(new Date());
      const today = formatISO(todayDate, { representation: 'date' }); // YYYY-MM-DD

      if (!userDoc.exists) {
        console.warn(`User document for ${userId} not found during streak update. Creating one.`);
        dailyStreak = 1;
        longestStreak = 1;
        lastLogDateStr = today;
        const newUserProfile: UserProfileData & { uid: string; createdAt: admin.firestore.FieldValue } = {
            uid: userId,
            email: context.auth.token.email || null,
            name: context.auth.token.name || 'User',
            hydrationGoal: 2000, // Default goal
            dailyStreak,
            longestStreak,
            lastLogDate: lastLogDateStr,
            reminderTimes: { '08:00': false, '12:00': true, '16:00': false }, // Default reminders
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        transaction.set(userDocRef, newUserProfile);
      } else {
        const userData = userDoc.data() as UserProfileData;
        dailyStreak = userData.dailyStreak || 0;
        longestStreak = userData.longestStreak || 0;
        lastLogDateStr = userData.lastLogDate || null;

        if (lastLogDateStr !== today) { // Only update streak if it's a log for a new day
          const yesterdayDate = subDays(todayDate, 1);
          const yesterday = formatISO(yesterdayDate, { representation: 'date' });
          if (lastLogDateStr === yesterday) {
            dailyStreak += 1;
          } else {
            // Streak broken if last log wasn't today or yesterday
            dailyStreak = 1;
          }
        }
        // If lastLogDateStr IS today, streak is already accounted for or it's the first log of the day continuing a streak from yesterday.
        // No action needed on dailyStreak if it's a subsequent log on the same day.
      }
      
      if (dailyStreak > longestStreak) {
        longestStreak = dailyStreak;
      }

      transaction.update(userDocRef, {
        lastLogDate: today,
        dailyStreak,
        longestStreak,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    return { success: true, logId: logRef.id, message: `${amount}ml logged successfully.` };
  } catch (error: any) {
    console.error('Error logging hydration for user', userId, ':', error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to log hydration.', error.message);
  }
});
