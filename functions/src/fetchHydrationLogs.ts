/**
 * @fileOverview Firebase Function to fetch hydration logs for the
 * authenticated user, typically for the last 7 days.
 */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { subDays, startOfDay, endOfDay } from 'date-fns';

interface FetchHydrationLogsData {
  daysToFetch?: number;
}

export const fetchHydrationLogs = functions.https.onCall(async (data: FetchHydrationLogsData, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }
  const userId = context.auth.uid;
  const daysToFetch = (typeof data?.daysToFetch === 'number' && data.daysToFetch > 0) ? data.daysToFetch : 7;

  const db = admin.firestore();
  const today = new Date();
  const startDate = startOfDay(subDays(today, daysToFetch -1)); // e.g., for 7 days, it's 6 days ago to include today
  const endDate = endOfDay(today);

  try {
    const snapshot = await db.collection('hydration_logs')
      .where('userId', '==', userId)
      .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(startDate))
      .where('timestamp', '<=', admin.firestore.Timestamp.fromDate(endDate))
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
  } catch (error: any) {
    console.error('Error fetching hydration logs for user', userId, ':', error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to fetch hydration logs.', error.message);
  }
});
