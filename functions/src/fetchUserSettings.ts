/**
 * @fileOverview Firebase Function to fetch user settings.
 */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Define a more specific type for what settings are returned
interface UserSettingsOutput {
  name?: string;
  hydrationGoal?: number;
  phoneNumber?: string | null;
  reminderTimes?: { [key: string]: boolean };
  email?: string | null;
  // Add other fields you want to expose as "settings"
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
      // It's possible a user is authenticated but their profile doesn't exist yet.
      // Create a default profile or return default settings.
      console.warn(`User profile for ${userId} not found. Returning default settings or an indication.`);
      // Depending on requirements, you might return default settings or an error
      // For now, returning an object indicating user not fully set up, or default values
      const defaultSettings: UserSettingsOutput = {
        name: context.auth.token.name || context.auth.token.email?.split('@')[0] || 'User',
        hydrationGoal: 2000, // Default
        phoneNumber: null,
        reminderTimes: { '08:00': false, '12:00': true, '16:00': false }, // Default
        email: context.auth.token.email || null,
      };
      return { settings: defaultSettings, profileExists: false };
      // Alternatively:
      // throw new functions.https.HttpsError('not-found', 'User profile not found. Please complete setup.');
    }
    
    const userData = userDoc.data();

    const settings: UserSettingsOutput = {
      name: userData?.name,
      hydrationGoal: userData?.hydrationGoal,
      phoneNumber: userData?.phoneNumber,
      reminderTimes: userData?.reminderTimes,
      email: userData?.email || context.auth.token.email,
    };

    return { settings, profileExists: true };
  } catch (error: any) {
    console.error('Error fetching user settings for user', userId, ':', error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to fetch user settings.', error.message);
  }
});
