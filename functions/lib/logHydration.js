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
exports.logHydration = void 0;
/**
 * @fileOverview Firebase Function to log hydration for an authenticated user
 * and update their streak data.
 */
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const date_fns_1 = require("date-fns");
exports.logHydration = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const userId = context.auth.uid;
    const { amount, timestamp: clientTimestamp } = data;
    if (typeof amount !== 'number' || amount <= 0) {
        throw new functions.https.HttpsError('invalid-argument', 'The function must be called with a valid "amount" (number > 0).');
    }
    const db = admin.firestore();
    try {
        let logTimestampValue = admin.firestore.FieldValue.serverTimestamp();
        if (clientTimestamp) {
            const parsedDate = new Date(clientTimestamp);
            if (!isNaN(parsedDate.getTime())) {
                logTimestampValue = admin.firestore.Timestamp.fromDate(parsedDate);
            }
            else {
                console.warn(`Invalid client timestamp string received: ${clientTimestamp}. Falling back to server timestamp.`);
            }
        }
        const logRef = await db.collection('hydration_logs').add({
            userId,
            amount,
            timestamp: logTimestampValue,
        });
        // Update streak data
        const userDocRef = db.collection('users').doc(userId);
        await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
            let dailyStreak = 0;
            let longestStreak = 0;
            let lastLogDateStr = null;
            // Ensure date comparison is done with start of day for consistency
            const todayDate = (0, date_fns_1.startOfDay)(new Date());
            const today = (0, date_fns_1.formatISO)(todayDate, { representation: 'date' }); // YYYY-MM-DD
            if (!userDoc.exists) {
                console.warn(`User document for ${userId} not found during streak update. Creating one.`);
                dailyStreak = 1;
                longestStreak = 1;
                lastLogDateStr = today;
                const newUserProfile = {
                    uid: userId,
                    email: context.auth.token.email || null,
                    name: context.auth.token.name || 'User',
                    hydrationGoal: 2000, // Default goal
                    dailyStreak,
                    longestStreak,
                    lastLogDate: lastLogDateStr,
                    reminderTimes: { '08:00': false, '12:00': true, '16:00': false }, // Default reminders
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                };
                transaction.set(userDocRef, newUserProfile);
            }
            else {
                const userData = userDoc.data();
                dailyStreak = userData.dailyStreak || 0;
                longestStreak = userData.longestStreak || 0;
                lastLogDateStr = userData.lastLogDate || null;
                if (lastLogDateStr !== today) { // Only update streak if it's a log for a new day
                    const yesterdayDate = (0, date_fns_1.subDays)(todayDate, 1);
                    const yesterday = (0, date_fns_1.formatISO)(yesterdayDate, { representation: 'date' });
                    if (lastLogDateStr === yesterday) {
                        dailyStreak += 1;
                    }
                    else {
                        // Streak broken if last log wasn't today or yesterday
                        dailyStreak = 1;
                    }
                }
                // If lastLogDateStr IS today, streak is already accounted for or it's the first log of the day continuing a streak from yesterday.
                // No action needed on dailyStreak if it's a subsequent log on the same day.
            }
            if (dailyStreak > longestStreak) {
                longestStreak = dailyStreak;
            }
            transaction.update(userDocRef, {
                lastLogDate: today,
                dailyStreak,
                longestStreak,
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            });
        });
        return { success: true, logId: logRef.id, message: `${amount}ml logged successfully.` };
    }
    catch (error) {
        console.error('Error logging hydration for user', userId, ':', error);
        if (error instanceof functions.https.HttpsError)
            throw error;
        throw new functions.https.HttpsError('internal', 'Failed to log hydration.', error.message);
    }
});
//# sourceMappingURL=logHydration.js.map