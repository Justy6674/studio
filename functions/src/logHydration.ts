import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { createAuthenticatedFunction } from "./types/firebase";

if (!admin.apps.length) {
  admin.initializeApp();
}

export interface LogHydrationData {
  amount: number;
  time: string;
  unit: string;
}

interface LogHydrationResponse {
  success: boolean;
  logId: string;
  message: string;
}

export const logHydration = createAuthenticatedFunction<LogHydrationData, LogHydrationResponse>(
  async (data, userId) => {
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
    } catch (error) {
      console.error("Failed to log hydration:", error);
      throw new functions.https.HttpsError("internal", "Failed to log hydration");
    }
  }
);
