/**
 * @fileOverview Main entry point for Firebase Functions.
 * Initializes Firebase Admin SDK and exports all function handlers.
 */
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
admin.initializeApp();

// Export other necessary Firebase services if needed globally by functions
// export const db = admin.firestore(); // db instance can be get locally in each function
// export const authAdmin = admin.auth(); // If needed for admin-level auth operations

// Import and re-export all function handlers
export { logHydration } from './logHydration';
export { getHydrationLogs } from './getHydrationLogs';
export { getStreakData } from './getStreakData';
export { getWeeklyChartData } from './getWeeklyChartData';
export { updateUserSettings } from './updateUserSettings';
export { generateMotivationalMessage } from './generateMotivationalMessage';
export { sendHydrationReminder } from './sendHydrationReminder';

// Example of a fully scheduled function for reminders (more complex setup)
/*
import * as functions from 'firebase-functions';
// import { findUsersToRemindAndSend } from './utils/reminderHelper'; // Hypothetical helper

export const scheduledHydrationReminders = functions.pubsub.schedule('every 1 hours from 08:00 to 20:00')
  .timeZone('America/New_York') // Example, ideally user's timezone or UTC then convert
  .onRun(async (context) => {
    console.log('Running scheduled hydration reminders at:', new Date().toLocaleTimeString());
    try {
      // await findUsersToRemindAndSend();
      // This function would query all users, check their reminderTimes and timezone,
      // then call sendHydrationReminder for each eligible user.
    } catch (error) {
      console.error('Error in scheduledHydrationReminders:', error);
    }
    return null;
  });
*/
