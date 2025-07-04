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
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const firebase_1 = require("./types/firebase");
if (!admin.apps.length) {
    admin.initializeApp();
}
exports.logHydration = (0, firebase_1.createAuthenticatedFunction)(async (data, userId) => {
    // Get user information from Firestore instead of context
    // This is a more robust approach anyway
    const userDoc = await admin.firestore().collection("users").doc(userId).get();
    const userData = userDoc.data() || {};
    const userEmail = userData.email || null;
    const userName = userData.name || "User";
    const logEntry = {
        amount: data.amount,
        time: data.time,
        unit: data.unit,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        userId,
        email: userEmail,
        name: userName,
    };
    try {
        const docRef = await admin.firestore().collection("hydration_logs").add(logEntry);
        return {
            success: true,
            logId: docRef.id,
            message: "Hydration logged successfully",
        };
    }
    catch (error) {
        console.error("Failed to log hydration:", error);
        throw new functions.https.HttpsError("internal", "Failed to log hydration");
    }
});
//# sourceMappingURL=logHydration.js.map