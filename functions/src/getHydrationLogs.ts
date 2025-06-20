/**
 * @fileOverview Firebase Function to fetch hydration logs for the
 * authenticated user, typically for the last 7 days.
 */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { createAuthenticatedFunction } from './types/firebase';

interface HydrationLogRequest {
  daysToFetch?: number;
}

interface HydrationLog {
  id: string;
  userId: string;
  amount: number;
  timestamp: string;
}

interface HydrationLogsResponse {
  logs: HydrationLog[];
}

export const getHydrationLogs = createAuthenticatedFunction<HydrationLogRequest, HydrationLogsResponse>(
  async (data, userId) => {
    const daysToFetch = (typeof data?.daysToFetch === 'number' && data.daysToFetch > 0) ? data.daysToFetch : 7;

  const db = admin.firestore();
  const today = new Date();
  const startDate = startOfDay(subDays(today, daysToFetch - 1)); // -6 for 7 days inclusive of today
  const endDate = endOfDay(today); // Ensure we cover all of today

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
