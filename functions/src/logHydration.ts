/**
 * @fileOverview Firebase Function to log hydration for an authenticated user
 * and update their streak data.
 */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

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
    
    // Update streak in a transaction to ensure atomicity
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userDocRef);
      
      if (!userDoc.exists) {
        // Optionally create a basic user profile if it doesn't exist,
        // though typically it should exist if the user is authenticated.
        // For this function, we'll assume it exists or is handled by client sign-up.
        console.warn(`User document for ${userId} not found during streak update.`);
        return; // Or throw an error if profile is strictly required
      }

      const userData = userDoc.data() as any; // Define UserProfile type if shared with functions
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      let dailyStreak = userData.dailyStreak || 0;
      let longestStreak = userData.longestStreak || 0;
      const lastLogDate = userData.lastLogDate;

      if (lastLogDate !== today) { // Only update streak if it's a new day or first log
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastLogDate === yesterdayStr) {
          dailyStreak += 1;
        } else {
          dailyStreak = 1; // Reset streak if last log wasn't yesterday or today
        }
      }
      
      if (dailyStreak > longestStreak) {
        longestStreak = dailyStreak;
      }

      transaction.update(userDocRef, {
        lastLogDate: today,
        dailyStreak,
        longestStreak,
      });
    });

    return { success: true, logId: logRef.id, message: `${amount}ml logged successfully.` };
  } catch (error) {
    console.error('Error logging hydration for user', userId, ':', error);
    throw new functions.https.HttpsError('internal', 'Failed to log hydration.');
  }
});
