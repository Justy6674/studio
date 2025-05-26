
/**
 * @fileOverview Main entry point for Firebase Functions.
 * Initializes Firebase Admin SDK and exports all function handlers.
 */
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
admin.initializeApp();

// Export all HTTPS Callable Functions
export { logHydration } from './logHydration';
export { fetchHydrationLogs } from './fetchHydrationLogs';
export { updateUserSettings } from './updateUserSettings';
export { fetchUserSettings } from './fetchUserSettings';
export { getStreaks } from './getStreaks';
export { getWeeklyChartData } from './getWeeklyChartData'; // Added export
export { generateMotivationalMessage } from './generateMotivationalMessage';
export { getHydrationMotivation } from './getHydrationMotivation'; // Added export
export { sendHydrationReminder } from './sendHydrationReminder';

// Example for a scheduled (cron) function to send reminders, if needed later.
// import * as functions from 'firebase-functions';
// export const scheduledReminderSender = functions.pubsub.schedule('every day 08:00').timeZone('America/New_York').onRun(async (context) => {
//   console.log('This will be run every day at 08:00 AM Eastern!');
//   // Here you would query users who want reminders at this time and call sendHydrationReminder for each.
//   return null;
// });
