/**
 * @fileOverview Firebase Function to log hydration for an authenticated user
 * and update their streak data.
 */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { isSameDay, subDays, formatISO } from 'date-fns';

export const logHydration = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }
  const userId = context.auth.uid;
  const { amount } = data;

  if (typeof amount !== 'number' || amount <= 0) {
    throw new functions.https.HttpsError('invalid-argument', 'The function must be called with a valid "amount" (number > 0).');
  }

  const db = admin.firestore();

  try {
    const logRef = await db.collection('hydration_logs').add({
      userId,
      amount,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    const userDocRef = db.collection('users').doc(userId);
    
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userDocRef);
      
      if (!userDoc.exists) {
        // This case should ideally be handled by client-side profile creation on signup.
        // For robustness, we could create a minimal profile here or throw.
        // For now, assuming profile exists or logging continues without streak update for new users if doc is missing.
        console.warn(`User document for ${userId} not found during streak update. Creating one.`);
        const today = formatISO(new Date(), { representation: 'date' });
        transaction.set(userDocRef, {
            uid: userId,
            email: context.auth.token.email || null, // From decoded token
            name: context.auth.token.name || 'User',
            hydrationGoal: 2000,
            dailyStreak: 1,
            longestStreak: 1,
            lastLogDate: today,
            reminderTimes: { '08:00': false, '12:00': true, '16:00': false },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return;
      }

      const userData = userDoc.data() as any; // Consider defining a UserProfile type shared with functions
      const today = formatISO(new Date(), { representation: 'date' }); // YYYY-MM-DD
      const lastLogDateStr = userData.lastLogDate; // Should be YYYY-MM-DD string

      let dailyStreak = userData.dailyStreak || 0;
      let longestStreak = userData.longestStreak || 0;

      if (lastLogDateStr !== today) { // Only update streak if it's a new day or first log
        const yesterday = formatISO(subDays(new Date(), 1), { representation: 'date' });

        if (lastLogDateStr === yesterday) {
          dailyStreak += 1;
        } else {
          dailyStreak = 1; // Reset streak if last log wasn't yesterday or today
        }
      }
      // If lastLogDateStr is today, streak already accounted for or it's the first log of the day for an ongoing streak.
      
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
