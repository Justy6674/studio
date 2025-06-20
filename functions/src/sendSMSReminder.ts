import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { createAuthenticatedFunction } from "./types/firebase";

const twilio = require('twilio');

interface SMSReminderRequest {
  tone?: string;
}

interface SMSReminderResponse {
  success: boolean;
  message: string;
}

// Define valid tones as a const array for type safety
const validTones = ["funny", "supportive", "crass", "kind", "weightloss"] as const;
type ValidTone = typeof validTones[number];

export const sendSMSReminder = createAuthenticatedFunction<SMSReminderRequest, SMSReminderResponse>(
  async (data, userId) => {
    const { tone } = data;
    
    // Validate tone if provided
    if (tone && !validTones.includes(tone as ValidTone)) {
      throw new functions.https.HttpsError('invalid-argument', 
        'Invalid tone. Must be one of: funny, supportive, crass, kind, weightloss');
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

      // Define reminder messages by tone
      const reminderMessages: Record<ValidTone, string> = {
        funny: "Hey water buddy! Your body is 70% water, not 70% coffee. Time to hydrate!",
        supportive: "You're doing great! Remember to stay hydrated - your body will thank you.",
        crass: "Oi! Drink some water now. Your pee shouldn't look like apple juice!",
        kind: "Gentle reminder: A glass of water now will keep your energy up all day.",
        weightloss: "Drinking water boosts your metabolism and helps burn calories. Hydrate now!"
      };

      // Select message based on tone or default to supportive
      const validTone = (tone && validTones.includes(tone as ValidTone)) ? (tone as ValidTone) : 'supportive';
      const messageToSend = reminderMessages[validTone];

      // Now send the SMS
      const twilioClient = twilio(twilioAccountSid, twilioAuthToken);
      await twilioClient.messages.create({
        body: messageToSend,
        from: twilioPhoneNumber,
        to: phoneNumber
      });

      // Log the SMS sent for analytics and rate limiting
      await admin.firestore().collection('sms_logs').add({
        userId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        phoneNumber,
        tone: validTone
      });

      return { 
        success: true,
        message: "SMS reminder sent successfully"
      };
    } catch (error: unknown) {
      console.error("Error sending SMS:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new functions.https.HttpsError('internal', `Failed to send SMS reminder: ${errorMessage}`);
    }
  }
);