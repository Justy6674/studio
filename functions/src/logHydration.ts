import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

export interface LogHydrationData {
  amount: number;
  time: string;
  unit: string;
}

export const logHydration = functions.https.onCall(
  async (data: LogHydrationData, context: functions.https.CallableContext) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
    }

    const userId = context.auth.uid;
    const userEmail = context.auth.token?.email || null;
    const userName = context.auth.token?.name || "User";

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
