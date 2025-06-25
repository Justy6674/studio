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
exports.getWeeklyChartData = void 0;
/**
 * @fileOverview Firebase Function to calculate daily total hydration amounts
 * for the past 7 days for graphing.
 */
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const date_fns_1 = require("date-fns");
const firebase_1 = require("./types/firebase");
exports.getWeeklyChartData = (0, firebase_1.createAuthenticatedFunction)(async (data, userId) => {
    const db = admin.firestore();
    try {
        const today = (0, date_fns_1.startOfDay)(new Date()); // Current date, time set to 00:00:00
        const sevenDaysAgoDate = (0, date_fns_1.startOfDay)((0, date_fns_1.subDays)(today, 6)); // 7 days ago, inclusive of today
        // Fetch logs for the last 7 days
        const logsSnapshot = await db.collection('hydration_logs')
            .where('userId', '==', userId)
            .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(sevenDaysAgoDate))
            .where('timestamp', '<=', admin.firestore.Timestamp.fromDate((0, date_fns_1.endOfDay)(today))) // Ensure we get all logs for today
            .orderBy('timestamp', 'asc') // Order by timestamp to process chronologically
            .get();
        const logs = logsSnapshot.docs.map(doc => {
            const docData = doc.data();
            return {
                amount: docData.amount,
                timestamp: docData.timestamp.toDate(),
            };
        });
        // Generate all dates in the interval [sevenDaysAgo, today]
        const dateInterval = (0, date_fns_1.eachDayOfInterval)({ start: sevenDaysAgoDate, end: today });
        // Map each day in the interval to its total hydration amount
        const weeklyChartData = dateInterval.map(dayInInterval => {
            const logsForDay = logs.filter(log => (0, date_fns_1.isSameDay)(log.timestamp, dayInInterval));
            const totalAmount = logsForDay.reduce((sum, log) => sum + log.amount, 0);
            return {
                date: (0, date_fns_1.format)(dayInInterval, 'yyyy-MM-dd'), // Consistent date format (e.g., "2023-10-27")
                totalAmount,
            };
        });
        return { weeklyChartData };
    }
    catch (error) {
        console.error('Error fetching weekly chart data for user', userId, ':', error);
        if (error instanceof functions.https.HttpsError)
            throw error;
        throw new functions.https.HttpsError('internal', 'Failed to fetch weekly chart data.', error.message);
    }
});
//# sourceMappingURL=getWeeklyChartData.js.map