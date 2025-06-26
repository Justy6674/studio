/**
 * @fileOverview Firebase Function to fetch hydration logs for the
 * authenticated user, typically for the last 7 days.
 */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';
import { createAuthenticatedFunction } from './types/firebase';

interface HydrationLogRequest {
  daysToFetch?: number;
}

interface HydrationLogResponse {
  id: string;
  userId: string;
  amount: number;
  timestamp: string;
}

interface HydrationLogsResponse {
  logs: HydrationLogResponse[];
}

export const getHydrationLogs = createAuthenticatedFunction<HydrationLogRequest, HydrationLogsResponse>(
  async (data, userId) => {
    const daysToFetch = (typeof data?.daysToFetch === 'number' && data.daysToFetch > 0) ? data.daysToFetch : 7;

    const db = admin.firestore();
    const today = new Date();
    const logs: HydrationLogResponse[] = [];

    try {
      // First, try to get data from the new structure: users/{userId}/hydration/{date}
      for (let i = 0; i < daysToFetch; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = format(date, 'yyyy-MM-dd');
        
        const docRef = db.collection('users').doc(userId).collection('hydration').doc(dateStr);
        const docSnap = await docRef.get();
        
        if (docSnap.exists) {
          const data = docSnap.data()!;
          const dayLogs = data.logs || [];
          
          dayLogs.forEach((log: any, index: number) => {
            logs.push({
              id: `${dateStr}_${index}`,
              userId,
              amount: log.amount,
              timestamp: log.timestamp?.toDate ? log.timestamp.toDate().toISOString() : new Date(log.timestamp).toISOString(),
            });
          });
        }
      }

      // If no logs found in new structure, fallback to legacy hydration_logs collection
      if (logs.length === 0) {
        console.log('No logs found in new structure, falling back to legacy collection');
        
        const startDate = startOfDay(subDays(today, daysToFetch - 1));
        const endDate = endOfDay(today);
        
        const snapshot = await db.collection('hydration_logs')
          .where('userId', '==', userId)
          .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(startDate))
          .where('timestamp', '<=', admin.firestore.Timestamp.fromDate(endDate))
          .orderBy('timestamp', 'desc')
          .get();

        snapshot.docs.forEach(doc => {
          const docData = doc.data();
          logs.push({
            id: doc.id,
            userId: docData.userId,
            amount: docData.amount,
            timestamp: (docData.timestamp as admin.firestore.Timestamp).toDate().toISOString(),
          });
        });
      }

      // Sort logs by timestamp descending
      logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return { logs };
    } catch (error: any) {
      console.error('Error fetching hydration logs for user', userId, ':', error);
      if (error instanceof functions.https.HttpsError) throw error;
      throw new functions.https.HttpsError('internal', 'Failed to fetch hydration logs.', error.message);
    }
  }
);
