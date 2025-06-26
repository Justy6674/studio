"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultDaySplits = exports.notificationTypes = exports.notificationFrequencies = exports.availableTones = void 0;
exports.availableTones = ["funny", "kind", "motivational", "sarcastic", "strict", "supportive", "crass", "weightloss"];
exports.notificationFrequencies = ["minimal", "moderate", "frequent"];
exports.notificationTypes = [
    {
        type: "sip",
        label: "Sip Reminder",
        description: "Small drink reminders (50ml)",
        emoji: "💧",
        defaultAmount: 50,
        defaultInterval: 15
    },
    {
        type: "glass",
        label: "Glass Reminder",
        description: "Full glass reminders (250ml)",
        emoji: "🥤",
        defaultAmount: 250,
        defaultInterval: 60
    },
    {
        type: "walk",
        label: "Walk & Drink",
        description: "Movement + hydration combo",
        emoji: "🚶‍♂️",
        defaultAmount: 100,
        defaultInterval: 90
    },
    {
        type: "drink",
        label: "General Drink",
        description: "Standard hydration reminder",
        emoji: "🥛",
        defaultAmount: 200,
        defaultInterval: 45
    },
    {
        type: "herbal_tea",
        label: "Herbal Tea",
        description: "Herbal tea break reminders",
        emoji: "🍵",
        defaultAmount: 200,
        defaultInterval: 120
    },
    {
        type: "milestone",
        label: "Milestone Alert",
        description: "Day-splitting progress targets",
        emoji: "🎯",
        defaultInterval: 0 // Calculated dynamically
    }
];
exports.defaultDaySplits = [
    {
        time: "10:00",
        targetMl: 1000,
        label: "Morning Target",
        confettiEnabled: true
    },
    {
        time: "15:00",
        targetMl: 2000,
        label: "Afternoon Target",
        confettiEnabled: true
    },
    {
        time: "20:00",
        targetMl: 3000,
        label: "Evening Target",
        confettiEnabled: true
    }
];
//# sourceMappingURL=types.js.map