/**
 * @fileOverview Firebase Function to fetch user settings.
 */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Define a more specific type for what settings are returned, if desired
// For now, it returns a subset of what might be in the UserProfile
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
      throw new functions.https.HttpsError('not-found', 'User profile not found.');
    }
    
    const userData = userDoc.data() as any; // Use a defined type if available

    // Construct the settings object to return, cherry-picking fields
    const settings: UserSettingsOutput = {
      name: userData.name,
      hydrationGoal: userData.hydrationGoal,
      phoneNumber: userData.phoneNumber,
      reminderTimes: userData.reminderTimes,
      email: userData.email, // Or context.auth.token.email
    };

    return { settings };
  } catch (error: any) {
    console.error('Error fetching user settings for user', userId, ':', error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to fetch user settings.', error.message);
  }
});
