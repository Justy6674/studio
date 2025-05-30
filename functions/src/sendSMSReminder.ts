import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const twilio = require('twilio');

export const sendSMSReminder = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { userId, tone } = data;

  if (!userId) {
    throw new functions.https.HttpsError('invalid-argument', 'userId is required');
  }

  // Verify user owns this profile
  if (context.auth.uid !== userId) {
    throw new functions.https.HttpsError('permission-denied', 'User can only send reminders to themselves');
  }

  // Validate tone
  const validTones = ["funny", "supportive", "crass", "kind", "weightloss"];
  if (tone && !validTones.includes(tone)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid tone. Must be one of: funny, supportive, crass, kind, weightloss');
  }

  try {
    // Get user settings to find phone number and preferences
    const userSettingsDoc = await admin.firestore().collection('user_preferences').doc(userId).get();
    if (!userSettingsDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User preferences not found');
    }

    const userSettings = userSettingsDoc.data();
    const phoneNumber = userSettings?.phoneNumber;

    if (!phoneNumber) {
      throw new functions.https.HttpsError('failed-precondition', 'Phone number not set in user preferences');
    }

    if (!userSettings?.smsReminderOn) {
      throw new functions.https.HttpsError('failed-precondition', 'SMS reminders are disabled for this user');
    }

    // Get Twilio credentials from environment
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      throw new functions.https.HttpsError('failed-precondition', 'Twilio credentials not configured');
    }

    // Generate tone-appropriate message
    const selectedTone = tone || userSettings?.aiTone || 'supportive';
    const messages = {
      funny: "G'day! Your water bottle is feeling lonely 😄 Time for a hydration celebration! 💧",
      supportive: "You're doing great! A glass of water now will keep you on track for your goals 💙💧",
      crass: "Oi! Stop being a drongo and drink some bloody water! Your body needs it! 💧",
      kind: "Gentle reminder to be kind to yourself with a refreshing glass of water 🌸💧",
      weightloss: "Boost your metabolism! Water helps burn fat and flush toxins. Drink up! 🔥💧"
    };

    const message = messages[selectedTone] || messages.supportive;

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
      tone: selectedTone,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'sent'
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending SMS reminder:', error);

    // Log the error
    await admin.firestore().collection('sms_logs').add({
      userId,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'failed',
      error: error.message
    });

    throw new functions.https.HttpsError('internal', 'Failed to send reminder');
  }
});