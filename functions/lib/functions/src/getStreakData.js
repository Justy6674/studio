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
exports.getStreakData = void 0;
/**
 * @fileOverview Firebase Function to fetch streak data (current and longest)
 * for the authenticated user.
 */
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const date_fns_1 = require("date-fns");
const firebase_1 = require("./types/firebase");
exports.getStreakData = (0, firebase_1.createAuthenticatedFunction)(async (data, userId) => {
    const db = admin.firestore();
    try {
        const userDocRef = db.collection('users').doc(userId);
        const userDoc = await userDocRef.get();
        if (!userDoc.exists) {
            console.warn(`User profile for ${userId} not found. Returning default streak data.`);
            // It's possible a user exists in Auth but not yet in Firestore if sign-up process was interrupted.
            // Or, if this function is called before user profile is fully created.
            return {
                dailyStreak: 0,
                longestStreak: 0,
                lastLogDate: null,
                message: "User profile not found, returning default streak data.",
            };
        }
        const userData = userDoc.data(); // Define UserProfile type if shared
        let dailyStreak = userData.dailyStreak || 0;
        const lastLogDateStr = userData.lastLogDate; // Should be YYYY-MM-DD string
        if (lastLogDateStr) {
            const today = (0, date_fns_1.formatISO)(new Date(), { representation: 'date' });
            const yesterday = (0, date_fns_1.formatISO)((0, date_fns_1.subDays)(new Date(), 1), { representation: 'date' });
            // If the last log date is not today and not yesterday, the streak is broken.
            if (lastLogDateStr !== today && lastLogDateStr !== yesterday) {
                dailyStreak = 0;
                // Optionally, update Firestore if streak is broken and hasn't been reset by a log operation.
                // This makes getStreakData more robust if logHydration failed or was missed.
                // await userDocRef.update({ dailyStreak: 0 });
            }
        }
        else {
            // No log date means no streak
            dailyStreak = 0;
        }
        return {
            dailyStreak: dailyStreak,
            longestStreak: userData.longestStreak || 0,
            lastLogDate: userData.lastLogDate || null, // lastLogDate is a YYYY-MM-DD string
        };
    }
    catch (error) {
        console.error('Error fetching streak data for user', userId, ':', error);
        if (error instanceof functions.https.HttpsError)
            throw error;
        throw new functions.https.HttpsError('internal', 'Failed to fetch streak data.', error.message);
    }
});
//# sourceMappingURL=getStreakData.js.map