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
exports.getStreaks = void 0;
/**
 * @fileOverview Firebase Function to fetch streak data (current and longest)
 * for the authenticated user.
 */
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const date_fns_1 = require("date-fns");
exports.getStreaks = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const userId = context.auth.uid;
    const db = admin.firestore();
    try {
        const userDocRef = db.collection('users').doc(userId);
        const userDoc = await userDocRef.get();
        if (!userDoc.exists) {
            console.warn(`User profile for ${userId} not found. Returning default streak data.`);
            return {
                dailyStreak: 0,
                longestStreak: 0,
                lastLogDate: null,
                message: "User profile not found, returning default streak data.",
            };
        }
        const userData = userDoc.data();
        let dailyStreak = userData.dailyStreak || 0;
        const lastLogDateStr = userData.lastLogDate; // Should be YYYY-MM-DD string
        if (lastLogDateStr) {
            const todayDate = (0, date_fns_1.startOfDay)(new Date());
            const today = (0, date_fns_1.formatISO)(todayDate, { representation: 'date' });
            const yesterdayDate = (0, date_fns_1.subDays)(todayDate, 1);
            const yesterday = (0, date_fns_1.formatISO)(yesterdayDate, { representation: 'date' });
            // If the last log date is not today and not yesterday, the streak is broken.
            if (lastLogDateStr !== today && lastLogDateStr !== yesterday) {
                dailyStreak = 0;
                // Note: This function primarily reads. Streak resets are mainly handled by logHydration.
                // If strictness is required here, an update could be performed, but it's often better
                // for the action (logging) to be the source of truth for mutations.
            }
        }
        else {
            // No log date means no streak
            dailyStreak = 0;
        }
        return {
            dailyStreak: dailyStreak,
            longestStreak: userData.longestStreak || 0,
            lastLogDate: userData.lastLogDate || null,
        };
    }
    catch (error) {
        console.error('Error fetching streak data for user', userId, ':', error);
        if (error instanceof functions.https.HttpsError)
            throw error;
        throw new functions.https.HttpsError('internal', 'Failed to fetch streak data.', error.message);
    }
});
//# sourceMappingURL=getStreaks.js.map