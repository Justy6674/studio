/**
 * @fileOverview Firebase Function to fetch hydration logs for the
 * authenticated user, typically for the last 7 days.
 */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const getHydrationLogs = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }
  const userId = context.auth.uid;
  // data.limitDays can be used if you want to make it flexible from client.
  // Defaulting to fetching logs from the start of 7 days ago.
  const daysToFetch = (typeof data.daysToFetch === 'number' && data.daysToFetch > 0) ? data.daysToFetch : 7;

  const db = admin.firestore();
  const endDate = new Date(); // Today
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - (daysToFetch -1)); // -6 for 7 days inclusive of today
  startDate.setHours(0, 0, 0, 0); // Start of that day

  try {
    const snapshot = await db.collection('hydration_logs')
      .where('userId', '==', userId)
      .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(startDate))
      .where('timestamp', '<=', admin.firestore.Timestamp.fromDate(endDate)) // Ensure we don't get future logs if any
      .orderBy('timestamp', 'desc')
      .get();

    const logs = snapshot.docs.map(doc => {
      const docData = doc.data();
      return {
        id: doc.id,
        userId: docData.userId,
        amount: docData.amount,
        timestamp: (docData.timestamp as admin.firestore.Timestamp).toDate().toISOString(),
      };
    });
    return { logs };
  } catch (error) {
    console.error('Error fetching hydration logs for user', userId, ':', error);
    throw new functions.https.HttpsError('internal', 'Failed to fetch hydration logs.');
  }
});
