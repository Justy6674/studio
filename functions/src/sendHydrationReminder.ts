/**
 * @fileOverview Firebase Function to send a hydration reminder SMS using Twilio.
 * This version is a callable function, suitable for manual triggering or by another process.
 * A fully scheduled function would query users based on current time and their preferences.
 */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import twilio from 'twilio';

let twilioClient: twilio.Twilio | null = null;

function initializeTwilioClient() {
  if (!twilioClient) {
    const TWILIO_ACCOUNT_SID = functions.config().twilio?.sid;
    const TWILIO_AUTH_TOKEN = functions.config().twilio?.authtoken;

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      console.error('Twilio credentials (SID or Auth Token) not configured. Set with `firebase functions:config:set twilio.sid="YOUR_SID" twilio.authtoken="YOUR_TOKEN"`');
      // Not throwing here, let the function attempt to send and fail if used without init.
      return;
    }
    twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  }
}


interface SendReminderInput {
  userId: string;
  message?: string; // Optional: if not provided, a generic or AI-generated message could be used
}

export const sendHydrationReminder = functions.https.onCall(async (data: SendReminderInput, context) => {
  // Initialize Twilio client if not already done.
  // This is useful for keeping the client instance warm across function invocations.
  initializeTwilioClient(); 
  
  const { userId, message: customMessage } = data;

  if (!context.auth && !data.userId) { // Allow unauth call if userId is explicitly passed (e.g. by admin/cron)
     throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated or provide a userId for admin tasks.');
  }

  const targetUserId = context.auth?.uid || userId;
  if (!targetUserId) {
      throw new functions.https.HttpsError('invalid-argument', 'User ID is required.');
  }

  const TWILIO_PHONE_NUMBER = functions.config().twilio?.phonenumber;
  if (!TWILIO_PHONE_NUMBER) {
    console.error('Twilio phone number not configured. Set with `firebase functions:config:set twilio.phonenumber="YOUR_TWILIO_NUMBER"`');
    throw new functions.https.HttpsError('internal', 'SMS service (sender phone number) not configured.');
  }

  if (!twilioClient) {
    // This means SID or Auth Token was missing during initialization.
    throw new functions.https.HttpsError('internal', 'SMS service (Twilio client) not initialized due to missing credentials.');
  }
  
  const db = admin.firestore();

  try {
    const userDoc = await db.collection('users').doc(targetUserId).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', `User profile for ${targetUserId} not found.`);
    }
    
    const userData = userDoc.data() as any; // Define UserProfile type if shared
    const toPhoneNumber = userData.phoneNumber;

    if (!toPhoneNumber) {
      console.log(`User ${targetUserId} does not have a phone number configured for SMS reminders.`);
      return { success: false, message: 'User phone number not configured.' };
    }

    // Basic E.164 validation (very simple, consider a library for robust validation)
    if (!/^\+[1-9]\d{1,14}$/.test(toPhoneNumber)) {
         console.error(`Invalid phone number format for user ${targetUserId}: ${toPhoneNumber}`);
         throw new functions.https.HttpsError('invalid-argument', `Invalid phone number format: ${toPhoneNumber}. Must be E.164.`);
    }
    
    let messageToSend = customMessage;
    if (!messageToSend) {
      // Placeholder for generating a default or AI-driven message if not provided
      // Could call the generateMotivationalMessage function or use a template.
      // For this example, we'll use a generic one if customMessage is missing.
      messageToSend = `Hi ${userData.name || 'there'}! Just a friendly reminder to stay hydrated today. Keep up the great work! 💧`;
    }

    const twilioResponse = await twilioClient.messages.create({
      body: messageToSend,
      from: TWILIO_PHONE_NUMBER,
      to: toPhoneNumber,
    });

    console.log(`SMS reminder sent to user ${targetUserId} (phone: ${toPhoneNumber}). Message SID: ${twilioResponse.sid}`);
    return { success: true, messageSid: twilioResponse.sid, message: "SMS reminder sent successfully." };

  } catch (error: any) {
    console.error(`Error sending SMS reminder to user ${targetUserId}:`, error);
    // Check for Twilio-specific errors if possible
    if (error.code && error.message) { // Twilio errors often have code and message
        throw new functions.https.HttpsError('internal', `Twilio error: ${error.message} (Code: ${error.code})`);
    }
    if (error instanceof functions.https.HttpsError) throw error; // Re-throw HttpsError
    throw new functions.https.HttpsError('internal', 'Failed to send SMS reminder.');
  }
});
