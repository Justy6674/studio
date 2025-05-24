/**
 * @fileOverview Firebase Function to send a hydration reminder SMS using Twilio.
 */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import twilio from 'twilio';

let twilioClient: twilio.Twilio | null = null;

// Initialize Twilio client
function initializeTwilioClient() {
  if (!twilioClient) {
    const TWILIO_ACCOUNT_SID = functions.config().twilio?.sid;
    const TWILIO_AUTH_TOKEN = functions.config().twilio?.authtoken;

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      console.error('Twilio credentials (SID or Auth Token) not configured. Set with `firebase functions:config:set twilio.sid="YOUR_SID" twilio.authtoken="YOUR_TOKEN"`');
      // Not throwing here allows function to be called, but it will fail if Twilio is used.
      // The call to twilioClient.messages.create will fail if twilioClient is null.
      return;
    }
    twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  }
}

interface SendReminderInput {
  userId?: string; // Optional: if called by admin/cron for a specific user
  message?: string; // Optional: if not provided, a generic or AI-generated message could be used
}

export const sendHydrationReminder = functions.https.onCall(async (data: SendReminderInput, context) => {
  initializeTwilioClient(); // Initialize client, will only run once per instance
  
  const { userId: specifiedUserId, message: customMessage } = data;

  // Determine target user ID
  let targetUserId: string | undefined = specifiedUserId;
  if (!targetUserId && context.auth) {
    targetUserId = context.auth.uid; // If called by an authenticated user for themselves
  }

  if (!targetUserId) {
     throw new functions.https.HttpsError('invalid-argument', 'User ID is required, either via authentication or as a parameter.');
  }

  const TWILIO_PHONE_NUMBER = functions.config().twilio?.phonenumber;
  if (!TWILIO_PHONE_NUMBER) {
    console.error('Twilio phone number not configured. Set with `firebase functions:config:set twilio.phonenumber="YOUR_TWILIO_NUMBER"`');
    throw new functions.https.HttpsError('internal', 'SMS service (sender phone number) not configured.');
  }

  if (!twilioClient) { // Check if client initialized successfully
    throw new functions.https.HttpsError('internal', 'SMS service (Twilio client) not initialized, likely due to missing credentials.');
  }
  
  const db = admin.firestore();

  try {
    const userDoc = await db.collection('users').doc(targetUserId).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', `User profile for ${targetUserId} not found.`);
    }
    
    const userData = userDoc.data() as any; // Define UserProfile type if shared
    const toPhoneNumber = userData.phoneNumber;
    const userName = userData.name || 'there';

    if (!toPhoneNumber) {
      // This is not an error from the function's perspective, just a condition where SMS cannot be sent.
      console.log(`User ${targetUserId} does not have a phone number configured for SMS reminders.`);
      return { success: false, message: 'User phone number not configured.' };
    }

    // Basic E.164 validation (server-side check)
    if (!/^\+[1-9]\d{1,14}$/.test(toPhoneNumber)) {
         console.error(`Invalid phone number format for user ${targetUserId}: ${toPhoneNumber}`);
         throw new functions.https.HttpsError('invalid-argument', `Invalid phone number format: ${toPhoneNumber}. Must be E.164 (e.g., +12345678900).`);
    }
    
    let messageToSend = customMessage;
    if (!messageToSend) {
      // If no custom message, use a generic one or potentially call generateMotivationalMessage.
      // For simplicity here, using a generic message.
      // Note: Calling another Firebase Function (like generateMotivationalMessage) from here
      // requires careful consideration of authentication and potential circular dependencies or increased billing.
      // It's often better to have a direct way to generate the message content if needed.
      messageToSend = `Hi ${userName}! Just a friendly reminder to stay hydrated today. Keep up the great work! 💧 - Water4WeightLoss`;
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
    // Check if it's a Twilio API error (they often have code and message)
    if (error.code && error.message && typeof error.code === 'number') { // Twilio errors
        throw new functions.https.HttpsError('internal', `Twilio error: ${error.message} (Code: ${error.code})`);
    }
    if (error instanceof functions.https.HttpsError) throw error; // Re-throw HttpsError
    // For other errors
    throw new functions.https.HttpsError('internal', 'Failed to send SMS reminder.', error.message);
  }
});
