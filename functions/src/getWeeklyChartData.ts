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
    const today = startOfDay(new Date()); // Current date, time set to 00:00:00
    const sevenDaysAgoDate = startOfDay(subDays(today, 6)); // 7 days ago, inclusive of today

    // Fetch logs for the last 7 days
    const logsSnapshot = await db.collection('hydration_logs')
      .where('userId', '==', userId)
      .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(sevenDaysAgoDate))
      .where('timestamp', '<=', admin.firestore.Timestamp.fromDate(endOfDay(today))) // Ensure we get all logs for today
      .orderBy('timestamp', 'asc') // Order by timestamp to process chronologically
      .get();

    const logs: Array<{ amount: number; timestamp: Date }> = logsSnapshot.docs.map(doc => {
      const docData = doc.data();
      return {
        amount: docData.amount as number,
        timestamp: (docData.timestamp as admin.firestore.Timestamp).toDate(),
      };
    });

    // Generate all dates in the interval [sevenDaysAgo, today]
    const dateInterval = eachDayOfInterval({ start: sevenDaysAgoDate, end: today });
    
    // Map each day in the interval to its total hydration amount
    const weeklyChartData = dateInterval.map(dayInInterval => {
      const logsForDay = logs.filter(log => isSameDay(log.timestamp, dayInInterval));
      const totalAmount = logsForDay.reduce((sum, log) => sum + log.amount, 0);
      return {
        date: format(dayInInterval, 'yyyy-MM-dd'), // Consistent date format (e.g., "2023-10-27")
        totalAmount,
      };
    });

    return { weeklyChartData };
  } catch (error: any) {
    console.error('Error fetching weekly chart data for user', userId, ':', error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to fetch weekly chart data.', error.message);
  }
});
