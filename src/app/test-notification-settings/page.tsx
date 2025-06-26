'use client';

import { NotificationSettings } from '@/components/notifications/NotificationSettings';

export default function TestNotificationSettingsPage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">🧪 Test: Enhanced Notification Settings</h1>
      
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <h2 className="font-semibold text-green-800 mb-2">✅ What Should Be Visible:</h2>
        <ul className="text-sm text-green-700 space-y-1">
          <li>• <strong>Device Settings</strong> section with Vibration and Smartwatch toggles</li>
          <li>• <strong>Notification Types</strong> with 6 types (Sip, Glass, Walk, Drink, Herbal Tea, Milestone)</li>
          <li>• <strong>Individual interval sliders</strong> for each notification type (5min - 8hrs)</li>
          <li>• <strong>Day-Splitting Targets</strong> with editable times and confetti settings</li>
          <li>• <strong>Auto-save</strong> with "Saving..." and "Saved" badges</li>
          <li>• <strong>Progressive disclosure</strong> - sections only show when master toggle is on</li>
        </ul>
      </div>

      <NotificationSettings 
        initialSettings={{
          fcmEnabled: true, // Enable to show all sections
          vibrationEnabled: true,
          smartwatchEnabled: true,
          motivationTone: 'funny',
          enabledNotificationTypes: ['sip', 'glass', 'milestone'],
          customNotificationIntervals: {
            sip: 30,
            glass: 90,
            walk: 120,
            drink: 60,
            herbal_tea: 180,
            milestone: 0
          },
          daySplitConfig: {
            enabled: true,
            splits: [
              { time: "10:00", targetMl: 1000, label: "Morning Target", confettiEnabled: true },
              { time: "15:00", targetMl: 2000, label: "Afternoon Target", confettiEnabled: true },
              { time: "20:00", targetMl: 3000, label: "Evening Target", confettiEnabled: false }
            ]
          }
        }}
        onSettingsChange={(settings) => {
          console.log('✅ Settings changed:', settings);
        }}
      />
    </div>
  );
} 