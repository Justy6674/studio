/**
 * @fileOverview Firebase Function to calculate daily total hydration amounts
 * for the past 7 days for graphing.
 */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { format, subDays, eachDayOfInterval, startOfDay, isSameDay, endOfDay } from 'date-fns';

export const getWeeklyChartData = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }
  const userId = context.auth.uid;
  const db = admin.firestore();

  try {
    const today = startOfDay(new Date());
    const sevenDaysAgoDate = startOfDay(subDays(today, 6)); // -6 for 7 days inclusive of today

    const logsSnapshot = await db.collection('hydration_logs')
      .where('userId', '==', userId)
      .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(sevenDaysAgoDate))
      .where('timestamp', '<=', admin.firestore.Timestamp.fromDate(endOfDay(today))) // Ensure we cover all of today
      .orderBy('timestamp', 'asc') // Ascending for easier processing if needed, though aggregation handles it
      .get();

    const logs: Array<{ amount: number; timestamp: Date }> = logsSnapshot.docs.map(doc => {
      const docData = doc.data();
      return {
        amount: docData.amount as number,
        timestamp: (docData.timestamp as admin.firestore.Timestamp).toDate(),
      };
    });

    const dateInterval = eachDayOfInterval({ start: sevenDaysAgoDate, end: today });
    
    const weeklyChartData = dateInterval.map(day => {
      const logsForDay = logs.filter(log => isSameDay(log.timestamp, day));
      const totalAmount = logsForDay.reduce((sum, log) => sum + log.amount, 0);
      return {
        date: format(day, 'yyyy-MM-dd'), // Consistent date format (e.g., "2023-10-27")
        // dateLabel: format(day, 'MMM d'), // e.g., "Oct 27" - client can format this
        totalAmount,
      };
    });

    return { weeklyChartData };
  } catch (error) {
    console.error('Error fetching weekly chart data for user', userId, ':', error);
    throw new functions.https.HttpsError('internal', 'Failed to fetch weekly chart data.');
  }
});
