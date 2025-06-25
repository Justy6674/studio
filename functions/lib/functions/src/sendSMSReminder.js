"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSMSReminder = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const firebase_1 = require("./types/firebase");
const twilio = require('twilio');
// Define valid tones as a const array for type safety
const validTones = ["funny", "supportive", "crass", "kind", "weightloss"];
exports.sendSMSReminder = (0, firebase_1.createAuthenticatedFunction)(async (data, userId) => {
    const { tone } = data;
    // Validate tone if provided
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
        // Define reminder messages by tone
        const reminderMessages = {
            funny: "Hey water buddy! Your body is 70% water, not 70% coffee. Time to hydrate!",
            supportive: "You're doing great! Remember to stay hydrated - your body will thank you.",
            crass: "Oi! Drink some water now. Your pee shouldn't look like apple juice!",
            kind: "Gentle reminder: A glass of water now will keep your energy up all day.",
            weightloss: "Drinking water boosts your metabolism and helps burn calories. Hydrate now!"
        };
        // Select message based on tone or default to supportive
        const validTone = (tone && validTones.includes(tone)) ? tone : 'supportive';
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
    }
    catch (error) {
        console.error("Error sending SMS:", error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new functions.https.HttpsError('internal', `Failed to send SMS reminder: ${errorMessage}`);
    }
});
//# sourceMappingURL=sendSMSReminder.js.map