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
export { generateMotivationalMessage } from './generateMotivationalMessage';
export { sendHydrationReminder } from './sendHydrationReminder';
