/**
 * @fileOverview Firebase Function to update user settings such as
 * daily hydration goal, reminder times, phone number, and preferences.
 */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { createAuthenticatedFunction } from './types/firebase';
import type { UserSettings, UserPreferences, MotivationTone, availableTones } from '../../src/lib/types'; // Adjust path as needed

interface UserSettingsInput {
  name?: string;
  hydrationGoal?: number;
  reminderTimes?: { [key: string]: boolean };
  phoneNumber?: string | null;
  preferences?: UserPreferences;
}

interface UpdateSettingsResponse {
  success: boolean;
  message: string;
  updatedFields?: string[];
}

export const updateUserSettings = createAuthenticatedFunction<UserSettingsInput, UpdateSettingsResponse>(
  async (data, userId) => {
    const { name, hydrationGoal, reminderTimes, phoneNumber, preferences } = data;
    const db = admin.firestore();

  const settingsToUpdate: Partial<UserSettings & { lastUpdated?: admin.firestore.FieldValue }> = {};

  if (name !== undefined) {
    if (typeof name === 'string') {
      settingsToUpdate.name = name.trim();
    } else {
     throw new functions.https.HttpsError('invalid-argument', 'Name must be a string.');
    }
  }

  if (hydrationGoal !== undefined) {
    if (typeof hydrationGoal === 'number' && hydrationGoal > 0) {
      settingsToUpdate.hydrationGoal = hydrationGoal;
    } else {
      throw new functions.https.HttpsError('invalid-argument', 'Hydration goal must be a positive number.');
    }
  }

  if (reminderTimes !== undefined) {
    if (typeof reminderTimes === 'object' && reminderTimes !== null) {
      const validTimes = ['08:00', '12:00', '16:00'];
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
    if (typeof phoneNumber === 'string' || phoneNumber === null) {
        settingsToUpdate.phoneNumber = phoneNumber === null ? undefined : phoneNumber;
    } else {
        throw new functions.https.HttpsError('invalid-argument', 'Phone number must be a string or null.');
    }
  }

  if (preferences !== undefined) {
    if (typeof preferences === 'object' && preferences !== null) {
      if (preferences.tone !== undefined) {
        // Type assertion for availableTones if imported directly
        const validTones: string[] = ["default", "funny", "crass", "rude", "sarcastic", "kind", "motivational", "clinical"];
        if (typeof preferences.tone === 'string' && validTones.includes(preferences.tone)) {
          // Ensure we are merging correctly if other preferences exist
          settingsToUpdate.preferences = { ...settingsToUpdate.preferences, tone: preferences.tone as MotivationTone };
        } else {
          throw new functions.https.HttpsError('invalid-argument', `Invalid tone value: ${preferences.tone}.`);
        }
      }
      // Add validation for other preferences if they exist
    } else {
      throw new functions.https.HttpsError('invalid-argument', 'Preferences must be an object.');
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
