
/**
 * @fileOverview Firebase Function to fetch user settings.
 */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import type { UserPreferences, MotivationTone } from '../../src/lib/types'; // Adjust path as needed

interface UserSettingsOutput {
  name?: string;
  hydrationGoal?: number;
  phoneNumber?: string | null;
  reminderTimes?: { [key: string]: boolean };
  email?: string | null;
  preferences?: UserPreferences;
}

export const fetchUserSettings = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }
  const userId = context.auth.uid;
  const db = admin.firestore();

  try {
    const userDocRef = db.collection('users').doc(userId);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      console.warn(`User profile for ${userId} not found. Returning default settings or an indication.`);
      const defaultSettings: UserSettingsOutput = {
        name: context.auth.token.name || context.auth.token.email?.split('@')[0] || 'User',
        hydrationGoal: 2000,
        phoneNumber: null,
        reminderTimes: { '08:00': false, '12:00': true, '16:00': false },
        email: context.auth.token.email || null,
        preferences: { tone: 'default' as MotivationTone },
      };
      return { settings: defaultSettings, profileExists: false };
    }
    
    const userData = userDoc.data();

    const settings: UserSettingsOutput = {
      name: userData?.name,
      hydrationGoal: userData?.hydrationGoal,
      phoneNumber: userData?.phoneNumber,
      reminderTimes: userData?.reminderTimes,
      email: userData?.email || context.auth.token.email,
      preferences: userData?.preferences || { tone: 'default' as MotivationTone },
    };

    return { settings, profileExists: true };
  } catch (error: any) {
    console.error('Error fetching user settings for user', userId, ':', error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to fetch user settings.', error.message);
  }
});
