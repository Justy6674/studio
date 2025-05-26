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
exports.getHydrationLogs = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const userId = context.auth.uid;
    const daysToFetch = (typeof data?.daysToFetch === 'number' && data.daysToFetch > 0) ? data.daysToFetch : 7;
    const db = admin.firestore();
    const today = new Date();
    const startDate = (0, date_fns_1.startOfDay)((0, date_fns_1.subDays)(today, daysToFetch - 1)); // -6 for 7 days inclusive of today
    const endDate = (0, date_fns_1.endOfDay)(today); // Ensure we cover all of today
    try {
        const snapshot = await db.collection('hydration_logs')
            .where('userId', '==', userId)
            .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(startDate))
            .where('timestamp', '<=', admin.firestore.Timestamp.fromDate(endDate))
            .orderBy('timestamp', 'desc')
            .get();
        const logs = snapshot.docs.map(doc => {
            const docData = doc.data();
            return {
                id: doc.id,
                userId: docData.userId,
                amount: docData.amount,
                timestamp: docData.timestamp.toDate().toISOString(),
            };
        });
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