/**
 * @fileOverview Firebase Function to log hydration for an authenticated user
 * and update their streak data.
 */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { formatISO, subDays, startOfDay, isSameDay } from 'date-fns';

interface LogHydrationData {
  amount: number;
  timestamp?: string | admin.firestore.Timestamp; // Optional: client can send ISO string or allow server to set
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
    let logTimestamp: admin.firestore.Timestamp | admin.firestore.FieldValue = admin.firestore.FieldValue.serverTimestamp();
    if (clientTimestamp) {
      if (typeof clientTimestamp === 'string') {
        const parsedDate = new Date(clientTimestamp);
        if (!isNaN(parsedDate.getTime())) {
          logTimestamp = admin.firestore.Timestamp.fromDate(parsedDate);
        } else {
          console.warn(`Invalid client timestamp string received: ${clientTimestamp}. Falling back to server timestamp.`);
        }
      } else if (clientTimestamp instanceof admin.firestore.Timestamp) {
        logTimestamp = clientTimestamp;
      }
    }
    
    const logRef = await db.collection('hydration_logs').add({
      userId,
      amount,
      timestamp: logTimestamp,
    });

    // Update streak data
    const userDocRef = db.collection('users').doc(userId);
    
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userDocRef);
      
      let dailyStreak = 0;
      let longestStreak = 0;
      let lastLogDateStr: string | null = null;

      const today = formatISO(startOfDay(new Date()), { representation: 'date' }); // YYYY-MM-DD

      if (!userDoc.exists) {
        // If user profile doesn't exist, create a basic one
        console.warn(`User document for ${userId} not found during streak update. Creating one.`);
        dailyStreak = 1;
        longestStreak = 1;
        lastLogDateStr = today;
        transaction.set(userDocRef, {
            uid: userId,
            email: context.auth.token.email || null,
            name: context.auth.token.name || 'User',
            hydrationGoal: 2000, // Default goal
            dailyStreak,
            longestStreak,
            lastLogDate: lastLogDateStr,
            reminderTimes: { '08:00': false, '12:00': true, '16:00': false }, // Default reminders
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        const userData = userDoc.data() as any; // Define UserProfile type if shared across client/server
        dailyStreak = userData.dailyStreak || 0;
        longestStreak = userData.longestStreak || 0;
        lastLogDateStr = userData.lastLogDate; // Should be YYYY-MM-DD string

        if (lastLogDateStr !== today) { // Only update streak if it's a log for a new day
          const yesterday = formatISO(subDays(startOfDay(new Date()), 1), { representation: 'date' });
          if (lastLogDateStr === yesterday) {
            dailyStreak += 1;
          } else {
            dailyStreak = 1; // Reset streak if last log wasn't yesterday
          }
        }
        // If lastLogDateStr IS today, streak is already accounted for or it's the first log of the day continuing a streak from yesterday.
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
