/**
 * @fileOverview Firebase Function to update user settings such as
 * daily hydration goal, reminder times, and phone number.
 */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

interface UserSettingsInput {
  name?: string;
  hydrationGoal?: number;
  reminderTimes?: { [key: string]: boolean }; // e.g., { '08:00': true, '12:00': false, '16:00': false }
  phoneNumber?: string | null; // Allow null to clear phone number
}

export const updateUserSettings = functions.https.onCall(async (data: UserSettingsInput, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }
  const userId = context.auth.uid;
  const { name, hydrationGoal, reminderTimes, phoneNumber } = data;
  const db = admin.firestore();

  const settingsToUpdate: Partial<UserSettingsInput & { lastUpdated?: admin.firestore.FieldValue }> = {};

  if (typeof name === 'string') {
    settingsToUpdate.name = name.trim();
  } else if (name !== undefined) {
     throw new functions.https.HttpsError('invalid-argument', 'Name must be a string.');
  }

  if (typeof hydrationGoal === 'number' && hydrationGoal > 0) {
    settingsToUpdate.hydrationGoal = hydrationGoal;
  } else if (hydrationGoal !== undefined) {
    throw new functions.https.HttpsError('invalid-argument', 'Hydration goal must be a positive number.');
  }

  if (reminderTimes !== undefined) {
    if (typeof reminderTimes === 'object' && reminderTimes !== null) {
      // Basic validation for reminderTimes structure
      const validTimes = ['08:00', '12:00', '16:00']; // Example valid times
      for (const timeKey in reminderTimes) {
        if (!validTimes.includes(timeKey) || typeof reminderTimes[timeKey] !== 'boolean') {
          throw new functions.https.HttpsError('invalid-argument', `Invalid reminderTimes format. Key ${timeKey} or its value is invalid.`);
        }
      }
      settingsToUpdate.reminderTimes = reminderTimes;
    } else {
        throw new functions.https.HttpsError('invalid-argument', 'reminderTimes must be an object.');
    }
  }
  
  if (phoneNumber !== undefined) {
    if (phoneNumber === null || phoneNumber === "" ) {
        settingsToUpdate.phoneNumber = null; // Clear phone number
    } else if (typeof phoneNumber === 'string') {
        // Basic E.164-like validation. Robust validation should ideally be on client or use a library.
        if (!/^\+?[1-9]\d{1,14}$/.test(phoneNumber)) {
             throw new functions.https.HttpsError('invalid-argument', 'Phone number format is invalid. Expected E.164-like format e.g. +12345678900.');
        }
        settingsToUpdate.phoneNumber = phoneNumber;
    } else {
        throw new functions.https.HttpsError('invalid-argument', 'Phone number must be a string or null.');
    }
  }

  if (Object.keys(settingsToUpdate).length === 0) {
    return { success: true, message: 'No valid settings provided to update.' };
  }
  
  settingsToUpdate.lastUpdated = admin.firestore.FieldValue.serverTimestamp();

  try {
    await db.collection('users').doc(userId).set(settingsToUpdate, { merge: true });
    return { success: true, message: 'User settings updated successfully.' };
  } catch (error: any) {
    console.error('Error updating user settings for user', userId, ':', error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to update user settings.', error.message);
  }
});
