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
exports.sendHydrationReminder = exports.generateMotivationalMessage = exports.getStreaks = exports.fetchUserSettings = exports.updateUserSettings = exports.fetchHydrationLogs = exports.logHydration = void 0;
/**
 * @fileOverview Main entry point for Firebase Functions.
 * Initializes Firebase Admin SDK and exports all function handlers.
 */
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin SDK
admin.initializeApp();
// Export all HTTPS Callable Functions
var logHydration_1 = require("./logHydration");
Object.defineProperty(exports, "logHydration", { enumerable: true, get: function () { return logHydration_1.logHydration; } });
var fetchHydrationLogs_1 = require("./fetchHydrationLogs");
Object.defineProperty(exports, "fetchHydrationLogs", { enumerable: true, get: function () { return fetchHydrationLogs_1.fetchHydrationLogs; } });
var updateUserSettings_1 = require("./updateUserSettings");
Object.defineProperty(exports, "updateUserSettings", { enumerable: true, get: function () { return updateUserSettings_1.updateUserSettings; } });
var fetchUserSettings_1 = require("./fetchUserSettings");
Object.defineProperty(exports, "fetchUserSettings", { enumerable: true, get: function () { return fetchUserSettings_1.fetchUserSettings; } });
var getStreaks_1 = require("./getStreaks");
Object.defineProperty(exports, "getStreaks", { enumerable: true, get: function () { return getStreaks_1.getStreaks; } });
var generateMotivationalMessage_1 = require("./generateMotivationalMessage");
Object.defineProperty(exports, "generateMotivationalMessage", { enumerable: true, get: function () { return generateMotivationalMessage_1.generateMotivationalMessage; } });
var sendHydrationReminder_1 = require("./sendHydrationReminder");
Object.defineProperty(exports, "sendHydrationReminder", { enumerable: true, get: function () { return sendHydrationReminder_1.sendHydrationReminder; } });
// Example for a scheduled (cron) function to send reminders, if needed later.
// import * as functions from 'firebase-functions';
// export const scheduledReminderSender = functions.pubsub.schedule('every day 08:00').timeZone('America/New_York').onRun(async (context) => {
//   console.log('This will be run every day at 08:00 AM Eastern!');
//   // Here you would query users who want reminders at this time and call sendHydrationReminder for each.
//   return null;
// });
//# sourceMappingURL=index.js.map