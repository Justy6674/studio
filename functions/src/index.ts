import * as functions from "firebase-functions";
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors({ origin: [/http:\/\/localhost:\d+/, /https:\/\/.*\.replit\.dev/] }));
import * as admin from "firebase-admin";

admin.initializeApp();

// Import all functions
import { logHydration } from "./logHydration";
import { getHydrationLogs } from "./getHydrationLogs";
import { generateMotivationalMessage } from "./generateMotivationalMessage";
import { sendSMSReminder } from "./sendSMSReminder";
import { updateUserSettings } from "./updateUserSettings";
import { getUserSettings } from "./getUserSettings";
import { getHydrationMotivation } from "./getHydrationMotivation";
import { getStreakData } from "./getStreakData";
import { getStreaks } from "./getStreaks";
import { getWeeklyChartData } from "./getWeeklyChartData";
import { getDailyHydrationSummary } from "./getDailyHydrationSummary";
import { handleBillingWebhook } from "./handleBillingWebhook";
import { generateHydrationGoalInsight } from "./generateHydrationGoalInsight";
import { processScheduledNotifications } from "./processScheduledNotifications";

// Export all functions
export { 
  logHydration,
  getHydrationLogs,
  generateMotivationalMessage,
  sendSMSReminder,
  updateUserSettings,
  getUserSettings,
  getHydrationMotivation,
  getStreakData,
  getStreaks,
  getWeeklyChartData,
  getDailyHydrationSummary,
  handleBillingWebhook,
  generateHydrationGoalInsight,
  processScheduledNotifications
};
