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
exports.getUserSettings = void 0;
/**
 * @fileOverview Firebase Function to fetch user settings.
 */
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const firebase_1 = require("./types/firebase");
exports.getUserSettings = (0, firebase_1.createAuthenticatedFunction)(async (data, userId) => {
    const db = admin.firestore();
    // Get auth token data from user record in Firebase Auth
    const userRecord = await admin.auth().getUser(userId);
    const userName = userRecord.displayName || userRecord.email?.split('@')[0] || 'User';
    const userEmail = userRecord.email || null;
    try {
        const userDocRef = db.collection('users').doc(userId);
        const userDoc = await userDocRef.get();
        if (!userDoc.exists) {
            console.warn(`User profile for ${userId} not found. Returning default settings or an indication.`);
            const defaultSettings = {
                name: userName,
                hydrationGoal: 2000,
                phoneNumber: null,
                reminderTimes: { '08:00': false, '12:00': true, '16:00': false },
                email: userEmail,
                preferences: { tone: 'default' },
            };
            return { settings: defaultSettings, profileExists: false };
        }
        ;
        const userData = userDoc.data();
        const settings = {
            name: userData?.name,
            hydrationGoal: userData?.hydrationGoal,
            phoneNumber: userData?.phoneNumber,
            reminderTimes: userData?.reminderTimes,
            email: userData?.email || userEmail,
            preferences: userData?.preferences || { tone: 'default' },
        };
        return { settings, profileExists: true };
    }
    catch (error) {
        console.error('Error fetching user settings for user', userId, ':', error);
        if (error instanceof functions.https.HttpsError)
            throw error;
        throw new functions.https.HttpsError('internal', 'Failed to fetch user settings.', error.message);
    }
});
//# sourceMappingURL=getUserSettings.js.map