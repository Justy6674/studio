import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const twilio = require('twilio');

export const sendHydrationReminder = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { userId, phoneNumber, message } = data;

  if (!userId || !phoneNumber || !message) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }

  // Verify user owns this profile
  if (context.auth.uid !== userId) {
    throw new functions.https.HttpsError('permission-denied', 'User can only send reminders to themselves');
  }

  try {
    // Get Twilio credentials from environment
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      throw new functions.https.HttpsError('failed-precondition', 'Twilio credentials not configured');
    }

    const client = twilio(twilioAccountSid, twilioAuthToken);

    // Send SMS
    await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: phoneNumber,
    });

    // Log the reminder in Firestore
    await admin.firestore().collection('sms_logs').add({
      userId,
      phoneNumber,
      message,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'sent'
    });

    return { success: true, message: 'Reminder sent successfully' };
  } catch (error) {
    console.error('Error sending SMS reminder:', error);

    // Log the error
    await admin.firestore().collection('sms_logs').add({
      userId,
      phoneNumber,
      message,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'failed',
      error: error.message
    });

    throw new functions.https.HttpsError('internal', 'Failed to send reminder');
  }
});