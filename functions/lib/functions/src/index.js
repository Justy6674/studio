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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processScheduledNotifications = exports.generateHydrationGoalInsight = exports.handleBillingWebhook = exports.getDailyHydrationSummary = exports.getWeeklyChartData = exports.getStreaks = exports.getStreakData = exports.getHydrationMotivation = exports.getUserSettings = exports.updateUserSettings = exports.sendSMSReminder = exports.generateMotivationalMessage = exports.getHydrationLogs = exports.logHydration = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: [/http:\/\/localhost:\d+/, /https:\/\/.*\.replit\.dev/] }));
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
// Import all functions
const logHydration_1 = require("./logHydration");
Object.defineProperty(exports, "logHydration", { enumerable: true, get: function () { return logHydration_1.logHydration; } });
const getHydrationLogs_1 = require("./getHydrationLogs");
Object.defineProperty(exports, "getHydrationLogs", { enumerable: true, get: function () { return getHydrationLogs_1.getHydrationLogs; } });
const generateMotivationalMessage_1 = require("./generateMotivationalMessage");
Object.defineProperty(exports, "generateMotivationalMessage", { enumerable: true, get: function () { return generateMotivationalMessage_1.generateMotivationalMessage; } });
const sendSMSReminder_1 = require("./sendSMSReminder");
Object.defineProperty(exports, "sendSMSReminder", { enumerable: true, get: function () { return sendSMSReminder_1.sendSMSReminder; } });
const updateUserSettings_1 = require("./updateUserSettings");
Object.defineProperty(exports, "updateUserSettings", { enumerable: true, get: function () { return updateUserSettings_1.updateUserSettings; } });
const getUserSettings_1 = require("./getUserSettings");
Object.defineProperty(exports, "getUserSettings", { enumerable: true, get: function () { return getUserSettings_1.getUserSettings; } });
const getHydrationMotivation_1 = require("./getHydrationMotivation");
Object.defineProperty(exports, "getHydrationMotivation", { enumerable: true, get: function () { return getHydrationMotivation_1.getHydrationMotivation; } });
const getStreakData_1 = require("./getStreakData");
Object.defineProperty(exports, "getStreakData", { enumerable: true, get: function () { return getStreakData_1.getStreakData; } });
const getStreaks_1 = require("./getStreaks");
Object.defineProperty(exports, "getStreaks", { enumerable: true, get: function () { return getStreaks_1.getStreaks; } });
const getWeeklyChartData_1 = require("./getWeeklyChartData");
Object.defineProperty(exports, "getWeeklyChartData", { enumerable: true, get: function () { return getWeeklyChartData_1.getWeeklyChartData; } });
const getDailyHydrationSummary_1 = require("./getDailyHydrationSummary");
Object.defineProperty(exports, "getDailyHydrationSummary", { enumerable: true, get: function () { return getDailyHydrationSummary_1.getDailyHydrationSummary; } });
const handleBillingWebhook_1 = require("./handleBillingWebhook");
Object.defineProperty(exports, "handleBillingWebhook", { enumerable: true, get: function () { return handleBillingWebhook_1.handleBillingWebhook; } });
const generateHydrationGoalInsight_1 = require("./generateHydrationGoalInsight");
Object.defineProperty(exports, "generateHydrationGoalInsight", { enumerable: true, get: function () { return generateHydrationGoalInsight_1.generateHydrationGoalInsight; } });
const processScheduledNotifications_1 = require("./processScheduledNotifications");
Object.defineProperty(exports, "processScheduledNotifications", { enumerable: true, get: function () { return processScheduledNotifications_1.processScheduledNotifications; } });
//# sourceMappingURL=index.js.map