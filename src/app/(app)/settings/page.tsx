"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Bell, 
  Vibrate, 
  MessageSquare,
  Settings as SettingsIcon,
  Check
} from "lucide-react";

export default function SettingsPage() {
  const [fcmEnabled, setFcmEnabled] = useState(false);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [vibrationIntensity, setVibrationIntensity] = useState<'light' | 'medium' | 'heavy'>('medium');
  const [motivationTone, setMotivationTone] = useState<string>('kind');
  const [notificationFrequency, setNotificationFrequency] = useState<string>('moderate');
  const [timeWindows, setTimeWindows] = useState<string[]>(['morning', 'afternoon']);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [smsMaxPerDay, setSmsMaxPerDay] = useState(1);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('hydration-settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setFcmEnabled(settings.fcmEnabled || false);
      setVibrationEnabled(settings.vibrationEnabled || true);
      setVibrationIntensity(settings.vibrationIntensity || 'medium');
      setMotivationTone(settings.motivationTone || 'kind');
      setNotificationFrequency(settings.notificationFrequency || 'moderate');
      setTimeWindows(settings.timeWindows || ['morning', 'afternoon']);
      setSmsEnabled(settings.smsEnabled || false);
      setSmsMaxPerDay(settings.smsMaxPerDay || 1);
    }
  }, []);

  // Save settings to localStorage whenever they change
  const saveSettings = () => {
    const settings = {
      fcmEnabled,
      vibrationEnabled,
      vibrationIntensity,
      motivationTone,
      notificationFrequency,
      timeWindows,
      smsEnabled,
      smsMaxPerDay
    };
    localStorage.setItem('hydration-settings', JSON.stringify(settings));
  };

  // Save settings whenever any setting changes
  useEffect(() => {
    saveSettings();
  }, [fcmEnabled, vibrationEnabled, vibrationIntensity, motivationTone, notificationFrequency, timeWindows, smsEnabled, smsMaxPerDay]);

  // Tone definitions with emojis and descriptions
  const tones = {
    funny: { label: 'Funny', emoji: '😂', description: 'Lighthearted and humorous' },
    kind: { label: 'Kind', emoji: '😊', description: 'Gentle and encouraging' },
    motivational: { label: 'Motivational', emoji: '💪', description: 'Energetic and inspiring' },
    sarcastic: { label: 'Sarcastic', emoji: '🙄', description: 'Witty with a playful edge' },
    strict: { label: 'Strict', emoji: '🧐', description: 'Direct and authoritative' },
    supportive: { label: 'Supportive', emoji: '🤗', description: 'Caring and understanding' },
    crass: { label: 'Crass', emoji: '💥', description: 'Bold and unfiltered' },
    weightloss: { label: 'Weight Loss', emoji: '🏋️‍♀️', description: 'Focused on weight management' }
  };

  // Frequency definitions
  const frequencies = {
    minimal: { label: 'Minimal', description: '1× per day' },
    moderate: { label: 'Moderate', description: '2-3× per day' },
    frequent: { label: 'Frequent', description: '4+ per day' }
  };

  // Time window definitions
  const timeWindowOptions = [
    { id: 'morning', label: 'Morning', time: '6-10 AM' },
    { id: 'midday', label: 'Midday', time: '10 AM-2 PM' },
    { id: 'afternoon', label: 'Afternoon', time: '2-6 PM' },
    { id: 'evening', label: 'Evening', time: '6-10 PM' }
  ];

  const toggleTimeWindow = (windowId: string) => {
    setTimeWindows(prev => 
      prev.includes(windowId) 
        ? prev.filter(id => id !== windowId)
        : [...prev, windowId]
    );
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SettingsIcon className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          </div>
        </div>

        {/* Push Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Push Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive hydration reminders on this device
                </p>
              </div>
              <button
                onClick={() => setFcmEnabled(!fcmEnabled)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  fcmEnabled ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    fcmEnabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            {fcmEnabled && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 font-medium">✅ Push Notifications Enabled!</p>
                <p className="text-xs text-green-700 mt-1">
                  You can now configure all notification settings below.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notification Tone - Only show when Push is ON */}
        {fcmEnabled && (
          <Card>
            <CardHeader>
              <CardTitle>Notification Tone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(tones).map(([tone, config]) => (
                  <button
                    key={tone}
                    onClick={() => setMotivationTone(tone)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      motivationTone === tone
                        ? 'bg-blue-50 border-blue-200 text-blue-800 ring-2 ring-blue-200'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{config.emoji}</span>
                      <span className="font-medium">{config.label}</span>
                      {motivationTone === tone && <Check className="h-4 w-4 text-blue-600 ml-auto" />}
                    </div>
                    <p className="text-xs text-gray-600">{config.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Frequency & Timing - Only show when Push is ON */}
        {fcmEnabled && (
          <Card>
            <CardHeader>
              <CardTitle>Frequency & Timing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Frequency Radio Group */}
              <div>
                <Label className="text-base font-medium mb-3 block">Frequency</Label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(frequencies).map(([freq, config]) => (
                    <button
                      key={freq}
                      onClick={() => setNotificationFrequency(freq)}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        notificationFrequency === freq
                          ? 'bg-blue-50 border-blue-200 text-blue-800 ring-2 ring-blue-200'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className="font-medium">{config.label}</div>
                      <div className="text-xs text-gray-600 mt-1">{config.description}</div>
                      {notificationFrequency === freq && <Check className="h-4 w-4 text-blue-600 mx-auto mt-1" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Windows */}
              <div>
                <Label className="text-base font-medium mb-3 block">Time Windows</Label>
                <div className="grid grid-cols-2 gap-2">
                  {timeWindowOptions.map((window) => (
                    <button
                      key={window.id}
                      onClick={() => toggleTimeWindow(window.id)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        timeWindows.includes(window.id)
                          ? 'bg-green-50 border-green-200 text-green-800 ring-2 ring-green-200'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{window.label}</div>
                          <div className="text-xs text-gray-600">{window.time}</div>
                        </div>
                        {timeWindows.includes(window.id) && (
                          <Check className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vibration - Only show when Push is ON */}
        {fcmEnabled && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Vibrate className="h-5 w-5" />
                Vibration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Vibrate on Reminder</p>
                  <p className="text-sm text-muted-foreground">
                    {vibrationEnabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
                <button
                  onClick={() => setVibrationEnabled(!vibrationEnabled)}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    vibrationEnabled ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      vibrationEnabled ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {vibrationEnabled && (
                <div>
                  <Label className="text-base font-medium mb-3 block">Intensity</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['light', 'medium', 'heavy'] as const).map((intensity) => (
                      <button
                        key={intensity}
                        onClick={() => setVibrationIntensity(intensity)}
                        className={`p-3 rounded-lg border text-center transition-all capitalize ${
                          vibrationIntensity === intensity
                            ? 'bg-blue-50 border-blue-200 text-blue-800 ring-2 ring-blue-200'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {intensity}
                        {vibrationIntensity === intensity && <Check className="h-4 w-4 text-blue-600 mx-auto mt-1" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* SMS Reminders - Only show when Push is ON */}
        {fcmEnabled && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                SMS Reminders
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">SMS Reminders</p>
                  <p className="text-sm text-muted-foreground">
                    Text message backup reminders
                  </p>
                </div>
                <button
                  onClick={() => setSmsEnabled(!smsEnabled)}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    smsEnabled ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      smsEnabled ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {smsEnabled && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-medium mb-3 block">Max per day</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSmsMaxPerDay(Math.max(1, smsMaxPerDay - 1))}
                        disabled={smsMaxPerDay <= 1}
                      >
                        -
                      </Button>
                      <span className="mx-4 font-medium">{smsMaxPerDay}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSmsMaxPerDay(Math.min(5, smsMaxPerDay + 1))}
                        disabled={smsMaxPerDay >= 5}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Disabled State Message */}
        {!fcmEnabled && (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">Push Notifications Disabled</p>
            <p className="text-sm">Enable push notifications to access all settings</p>
          </div>
        )}
      </div>
    </div>
  );
}