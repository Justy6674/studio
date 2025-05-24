/**
 * @fileOverview Firebase Function to update user settings such as
 * daily hydration goal, reminder times, and phone number.
 */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

interface UserSettingsInput {
  hydrationGoal?: number;
  reminderTimes?: { [key: string]: boolean }; // e.g., { '08:00': true, '12:00': false }
  phoneNumber?: string;
  name?: string; // Allow updating name as well
}

export const updateUserSettings = functions.https.onCall(async (data: UserSettingsInput, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }
  const userId = context.auth.uid;
  const { hydrationGoal, reminderTimes, phoneNumber, name } = data;
  const db = admin.firestore();

  const settingsToUpdate: Partial<UserSettingsInput> & { lastUpdated?: admin.firestore.FieldValue } = {};

  if (typeof hydrationGoal === 'number' && hydrationGoal > 0) {
    settingsToUpdate.hydrationGoal = hydrationGoal;
  } else if (hydrationGoal !== undefined) {
    throw new functions.https.HttpsError('invalid-argument', 'Hydration goal must be a positive number.');
  }

  if (reminderTimes !== undefined) {
    // Basic validation for reminderTimes structure could be added here
    // e.g., check if keys are valid time strings and values are booleans
    settingsToUpdate.reminderTimes = reminderTimes;
  }
  
  if (phoneNumber !== undefined) {
    // Basic phone number validation could be added (e.g., format)
    // For simplicity, we're accepting it as is. Ensure E.164 format for Twilio.
    settingsToUpdate.phoneNumber = phoneNumber === "" ? null : phoneNumber; // Store empty string as null or handle
  }

  if (typeof name === 'string') {
    settingsToUpdate.name = name;
  }


  if (Object.keys(settingsToUpdate).length === 0) {
    // If only undefined or invalid values were passed, nothing to update.
    return { success: true, message: 'No valid settings provided to update.' };
    // throw new functions.https.HttpsError('invalid-argument', 'No valid settings provided to update.');
  }
  
  settingsToUpdate.lastUpdated = admin.firestore.FieldValue.serverTimestamp();

  try {
    await db.collection('users').doc(userId).set(settingsToUpdate, { merge: true });
    return { success: true, message: 'User settings updated successfully.' };
  } catch (error) {
    console.error('Error updating user settings for user', userId, ':', error);
    throw new functions.https.HttpsError('internal', 'Failed to update user settings.');
  }
});
