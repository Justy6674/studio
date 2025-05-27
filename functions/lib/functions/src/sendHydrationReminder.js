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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendHydrationReminder = void 0;
/**
 * @fileOverview Firebase Function to send a hydration reminder SMS using Twilio.
 */
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const twilio_1 = __importDefault(require("twilio"));
let twilioClient = null;
// Initialize Twilio client
function initializeTwilioClient() {
    if (!twilioClient) {
        const TWILIO_ACCOUNT_SID = functions.config().twilio?.sid;
        const TWILIO_AUTH_TOKEN = functions.config().twilio?.authtoken;
        if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
            console.error('Twilio credentials (SID or Auth Token) not configured. Set with `firebase functions:config:set twilio.sid="YOUR_SID" twilio.authtoken="YOUR_TOKEN"`');
            return; // Client remains null, will be checked before use
        }
        twilioClient = (0, twilio_1.default)(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    }
}
exports.sendHydrationReminder = functions.https.onCall(async (data, context) => {
    initializeTwilioClient();
    const { userId: specifiedUserId, message: customMessage } = data;
    let targetUserId = specifiedUserId;
    if (!targetUserId && context.auth) {
        targetUserId = context.auth.uid;
    }
    if (!targetUserId) {
        throw new functions.https.HttpsError('invalid-argument', 'User ID is required, either via authentication or as a parameter.');
    }
    const TWILIO_PHONE_NUMBER = functions.config().twilio?.phonenumber;
    if (!TWILIO_PHONE_NUMBER) {
        console.error('Twilio phone number not configured. Set with `firebase functions:config:set twilio.phonenumber="YOUR_TWILIO_NUMBER"`');
        throw new functions.https.HttpsError('failed-precondition', 'SMS service (sender phone number) not configured.');
    }
    if (!twilioClient) {
        throw new functions.https.HttpsError('failed-precondition', 'SMS service (Twilio client) not initialized, likely due to missing credentials.');
    }
    const db = admin.firestore();
    try {
        const userDoc = await db.collection('users').doc(targetUserId).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('not-found', `User profile for ${targetUserId} not found.`);
        }
        const userData = userDoc.data();
        const toPhoneNumber = userData.phoneNumber;
        const userName = userData.name || 'there';
        if (!toPhoneNumber) {
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
            // For a simple default message. Could also call generateMotivationalMessage here if complex logic is needed.
            messageToSend = `Hi ${userName}! Just a friendly reminder from Water4WeightLoss to stay hydrated today. Keep up the great work! 💧`;
        }
        const twilioResponse = await twilioClient.messages.create({
            body: messageToSend,
            from: TWILIO_PHONE_NUMBER,
            to: toPhoneNumber,
        });
        console.log(`SMS reminder sent to user ${targetUserId} (phone: ${toPhoneNumber}). Message SID: ${twilioResponse.sid}`);
        return { success: true, messageSid: twilioResponse.sid, message: "SMS reminder sent successfully." };
    }
    catch (error) {
        console.error(`Error sending SMS reminder to user ${targetUserId}:`, error);
        if (error.code && error.message && typeof error.code === 'number') { // Twilio errors often have code and message
            throw new functions.https.HttpsError('internal', `Twilio error: ${error.message} (Code: ${error.code})`);
        }
        if (error instanceof functions.https.HttpsError)
            throw error;
        throw new functions.https.HttpsError('internal', 'Failed to send SMS reminder.', error.message);
    }
});
//# sourceMappingURL=sendHydrationReminder.js.map