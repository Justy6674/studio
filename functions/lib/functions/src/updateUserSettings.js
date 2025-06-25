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
exports.updateUserSettings = void 0;
/**
 * @fileOverview Firebase Function to update user settings such as
 * daily hydration goal, reminder times, phone number, and preferences.
 */
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const firebase_1 = require("./types/firebase");
exports.updateUserSettings = (0, firebase_1.createAuthenticatedFunction)(async (data, userId) => {
    const { name, hydrationGoal, reminderTimes, phoneNumber, preferences } = data;
    const db = admin.firestore();
    const settingsToUpdate = {};
    if (name !== undefined) {
        if (typeof name === 'string') {
            settingsToUpdate.name = name.trim();
        }
        else {
            throw new functions.https.HttpsError('invalid-argument', 'Name must be a string.');
        }
    }
    if (hydrationGoal !== undefined) {
        if (typeof hydrationGoal === 'number' && hydrationGoal > 0) {
            settingsToUpdate.hydrationGoal = hydrationGoal;
        }
        else {
            throw new functions.https.HttpsError('invalid-argument', 'Hydration goal must be a positive number.');
        }
    }
    if (reminderTimes !== undefined) {
        if (typeof reminderTimes === 'object' && reminderTimes !== null) {
            const validTimes = ['08:00', '12:00', '16:00'];
            for (const timeKey in reminderTimes) {
                if (!validTimes.includes(timeKey) || typeof reminderTimes[timeKey] !== 'boolean') {
                    throw new functions.https.HttpsError('invalid-argument', `Invalid reminderTimes format. Key ${timeKey} or its value is invalid.`);
                }
            }
            settingsToUpdate.reminderTimes = reminderTimes;
        }
        else {
            throw new functions.https.HttpsError('invalid-argument', 'reminderTimes must be an object.');
        }
    }
    if (phoneNumber !== undefined) {
        if (typeof phoneNumber === 'string' || phoneNumber === null) {
            settingsToUpdate.phoneNumber = phoneNumber === null ? undefined : phoneNumber;
        }
        else {
            throw new functions.https.HttpsError('invalid-argument', 'Phone number must be a string or null.');
        }
    }
    if (preferences !== undefined) {
        if (typeof preferences === 'object' && preferences !== null) {
            if (preferences.tone !== undefined) {
                // Type assertion for availableTones if imported directly
                const validTones = ["default", "funny", "crass", "rude", "sarcastic", "kind", "motivational", "clinical"];
                if (typeof preferences.tone === 'string' && validTones.includes(preferences.tone)) {
                    // Ensure we are merging correctly if other preferences exist
                    settingsToUpdate.preferences = { ...settingsToUpdate.preferences, tone: preferences.tone };
                }
                else {
                    throw new functions.https.HttpsError('invalid-argument', `Invalid tone value: ${preferences.tone}.`);
                }
            }
            // Add validation for other preferences if they exist
        }
        else {
            throw new functions.https.HttpsError('invalid-argument', 'Preferences must be an object.');
        }
    }
    if (Object.keys(settingsToUpdate).length === 0) {
        return { success: true, message: 'No valid settings provided to update.' };
    }
    settingsToUpdate.lastUpdated = admin.firestore.FieldValue.serverTimestamp();
    try {
        await db.collection('users').doc(userId).set(settingsToUpdate, { merge: true });
        return { success: true, message: 'User settings updated successfully.' };
    }
    catch (error) {
        console.error('Error updating user settings for user', userId, ':', error);
        if (error instanceof functions.https.HttpsError)
            throw error;
        throw new functions.https.HttpsError('internal', 'Failed to update user settings.', error.message);
    }
});
//# sourceMappingURL=updateUserSettings.js.map