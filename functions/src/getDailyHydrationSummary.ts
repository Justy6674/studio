import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { createAuthenticatedFunction } from "./types/firebase";

if (!admin.apps.length) {
  admin.initializeApp();
}

interface DailyHydrationSummary {
  streak: number;
  averageIntake: number;
  dailyTotal: number;
}

interface DailyHydrationRequest {
  // Add request parameters here if needed
}

export const getDailyHydrationSummary = createAuthenticatedFunction<DailyHydrationRequest, DailyHydrationSummary>(
  async (data, userId) => {

    try {
      const db = admin.firestore();
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
      
      // Get today's total
      const todaySnapshot = await db
        .collection('hydration_logs')
        .where('userId', '==', userId)
        .where('createdAt', '>=', todayStart)
        .where('createdAt', '<', todayEnd)
        .get();

      const dailyTotal = todaySnapshot.docs.reduce((total, doc) => {
        return total + (doc.data().amount || 0);
      }, 0);

      // Calculate 7-day average intake
      const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const weekSnapshot = await db
        .collection('hydration_logs')
        .where('userId', '==', userId)
        .where('createdAt', '>=', sevenDaysAgo)
        .where('createdAt', '<', today)
        .get();

      const weeklyTotal = weekSnapshot.docs.reduce((total, doc) => {
        return total + (doc.data().amount || 0);
      }, 0);

      const averageIntake = Math.round(weeklyTotal / 7);

      // Simple streak calculation - count consecutive days with hydration logs
      let streak = 0;
      const goalAmount = 2000; // Default goal in ml

      for (let i = 0; i < 30; i++) { // Check last 30 days max
        const checkDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStart = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

        const daySnapshot = await db
          .collection('hydration_logs')
          .where('userId', '==', userId)
          .where('createdAt', '>=', dayStart)
          .where('createdAt', '<', dayEnd)
          .get();

        const dayTotal = daySnapshot.docs.reduce((total, doc) => {
          return total + (doc.data().amount || 0);
        }, 0);

        if (dayTotal >= goalAmount) {
          streak++;
        } else {
          break;
        }
      }

      const result: DailyHydrationSummary = {
        streak,
        averageIntake,
        dailyTotal
      };

      return result;

    } catch (error) {
      console.error('Error getting daily hydration summary:', error);
      throw new functions.https.HttpsError('internal', 'Failed to get hydration summary');
    }
  }
); 