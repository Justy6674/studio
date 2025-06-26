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
exports.getHydrationLogs = void 0;
/**
 * @fileOverview Firebase Function to fetch hydration logs for the
 * authenticated user, typically for the last 7 days.
 */
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const date_fns_1 = require("date-fns");
const firebase_1 = require("./types/firebase");
exports.getHydrationLogs = (0, firebase_1.createAuthenticatedFunction)(async (data, userId) => {
    const daysToFetch = (typeof data?.daysToFetch === 'number' && data.daysToFetch > 0) ? data.daysToFetch : 7;
    const db = admin.firestore();
    const today = new Date();
    const logs = [];
    try {
        // First, try to get data from the new structure: users/{userId}/hydration/{date}
        for (let i = 0; i < daysToFetch; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = (0, date_fns_1.format)(date, 'yyyy-MM-dd');
            const docRef = db.collection('users').doc(userId).collection('hydration').doc(dateStr);
            const docSnap = await docRef.get();
            if (docSnap.exists) {
                const data = docSnap.data();
                const dayLogs = data.logs || [];
                dayLogs.forEach((log, index) => {
                    logs.push({
                        id: `${dateStr}_${index}`,
                        userId,
                        amount: log.amount,
                        timestamp: log.timestamp?.toDate ? log.timestamp.toDate().toISOString() : new Date(log.timestamp).toISOString(),
                    });
                });
            }
        }
        // If no logs found in new structure, fallback to legacy hydration_logs collection
        if (logs.length === 0) {
            console.log('No logs found in new structure, falling back to legacy collection');
            const startDate = (0, date_fns_1.startOfDay)((0, date_fns_1.subDays)(today, daysToFetch - 1));
            const endDate = (0, date_fns_1.endOfDay)(today);
            const snapshot = await db.collection('hydration_logs')
                .where('userId', '==', userId)
                .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(startDate))
                .where('timestamp', '<=', admin.firestore.Timestamp.fromDate(endDate))
                .orderBy('timestamp', 'desc')
                .get();
            snapshot.docs.forEach(doc => {
                const docData = doc.data();
                logs.push({
                    id: doc.id,
                    userId: docData.userId,
                    amount: docData.amount,
                    timestamp: docData.timestamp.toDate().toISOString(),
                });
            });
        }
        // Sort logs by timestamp descending
        logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        return { logs };
    }
    catch (error) {
        console.error('Error fetching hydration logs for user', userId, ':', error);
        if (error instanceof functions.https.HttpsError)
            throw error;
        throw new functions.https.HttpsError('internal', 'Failed to fetch hydration logs.', error.message);
    }
});
//# sourceMappingURL=getHydrationLogs.js.map