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
exports.getDailyHydrationSummary = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const firebase_1 = require("./types/firebase");
if (!admin.apps.length) {
    admin.initializeApp();
}
exports.getDailyHydrationSummary = (0, firebase_1.createAuthenticatedFunction)(async (data, userId) => {
    try {
        const db = admin.firestore();
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
        // Get today's total
        const todaySnapshot = await db
            .collection('hydration_logs')
            .where('userId', '==', userId)
            .where('createdAt', '>=', todayStart)
            .where('createdAt', '<', todayEnd)
            .get();
        const dailyTotal = todaySnapshot.docs.reduce((total, doc) => {
            return total + (doc.data().amount || 0);
        }, 0);
        // Calculate 7-day average intake
        const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const weekSnapshot = await db
            .collection('hydration_logs')
            .where('userId', '==', userId)
            .where('createdAt', '>=', sevenDaysAgo)
            .where('createdAt', '<', today)
            .get();
        const weeklyTotal = weekSnapshot.docs.reduce((total, doc) => {
            return total + (doc.data().amount || 0);
        }, 0);
        const averageIntake = Math.round(weeklyTotal / 7);
        // Simple streak calculation - count consecutive days with hydration logs
        let streak = 0;
        const goalAmount = 2000; // Default goal in ml
        for (let i = 0; i < 30; i++) { // Check last 30 days max
            const checkDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
            const dayStart = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());
            const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
            const daySnapshot = await db
                .collection('hydration_logs')
                .where('userId', '==', userId)
                .where('createdAt', '>=', dayStart)
                .where('createdAt', '<', dayEnd)
                .get();
            const dayTotal = daySnapshot.docs.reduce((total, doc) => {
                return total + (doc.data().amount || 0);
            }, 0);
            if (dayTotal >= goalAmount) {
                streak++;
            }
            else {
                break;
            }
        }
        const result = {
            streak,
            averageIntake,
            dailyTotal
        };
        return result;
    }
    catch (error) {
        console.error('Error getting daily hydration summary:', error);
        throw new functions.https.HttpsError('internal', 'Failed to get hydration summary');
    }
});
//# sourceMappingURL=getDailyHydrationSummary.js.map