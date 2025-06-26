"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Bell, 
  Vibrate, 
  MessageSquare,
  Settings as SettingsIcon,
  Check
} from "lucide-react";

// PERFECT iOS PILL TOGGLE - EXACT PILL SHAPE
// PROPER iOS PILL TOGGLE - FORCED WITH EXACT DIMENSIONS
const SimpleToggle = ({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) => (
  <div
    onClick={() => onChange(!checked)}
    style={{
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      height: '32px',
      width: '58px', // Wider to ensure pill shape
      backgroundColor: checked ? '#22c55e' : '#d1d5db',
      borderRadius: '16px', // Half of height for proper pill
      border: 'none',
      outline: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: checked 
        ? '0 2px 8px rgba(34, 197, 94, 0.3)' 
        : '0 2px 4px rgba(0, 0, 0, 0.1)'
    }}
  >
    <div
      style={{
        position: 'absolute',
        top: '3px',
        left: checked ? '29px' : '3px', // Adjusted for wider container
        width: '26px',
        height: '26px',
        backgroundColor: '#ffffff',
        borderRadius: '50%',
        transition: 'all 0.2s ease',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
      }}
    />
  </div>
);

export default function SettingsPage() {
  const [fcmEnabled, setFcmEnabled] = useState(false);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [vibrationIntensity, setVibrationIntensity] = useState('medium');
  const [motivationTone, setMotivationTone] = useState('kind');
  const [notificationFrequency, setNotificationFrequency] = useState('moderate');
  const [timeWindows, setTimeWindows] = useState(['morning', 'afternoon']);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [smsMaxPerDay, setSmsMaxPerDay] = useState(1);

  // Load settings from Firebase on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/user-settings');
        if (response.ok) {
          const data = await response.json();
          const settings = data.settings;
          
          setFcmEnabled(settings.fcmEnabled || false);
          setVibrationEnabled(settings.vibrationEnabled !== undefined ? settings.vibrationEnabled : true);
          setVibrationIntensity(settings.vibrationIntensity || 'medium');
          setMotivationTone(settings.motivationTone || 'kind');
          setNotificationFrequency(settings.notificationFrequency || 'moderate');
          setTimeWindows(settings.timeWindows || ['morning', 'afternoon']);
          setSmsEnabled(settings.smsEnabled || false);
          setSmsMaxPerDay(settings.smsMaxPerDay || 1);
          
          console.log('✅ Settings loaded from Firebase:', settings);
        } else {
          console.error('❌ Failed to load settings from Firebase');
        }
      } catch (error) {
        console.error('❌ Error loading settings:', error);
      }
    };
    
    loadSettings();
  }, []);

  // Save settings to Firebase instead of localStorage
  const saveSettings = async () => {
    try {
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
      
      // Save to Firebase via API
      const response = await fetch('/api/user-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save settings');
      }
      
      console.log('✅ Settings saved to Firebase');
    } catch (error) {
      console.error('❌ Failed to save settings:', error);
    }
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
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
          </div>
        </div>

        {/* Push Notifications */}
        <Card className="glass-effect border-accent/30">
          <CardHeader className="border-b border-accent/20">
            <CardTitle className="flex items-center gap-2 text-foreground text-xl">
              <Bell className="h-6 w-6" />
              Push Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-muted-foreground">
                  {fcmEnabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
              <SimpleToggle checked={fcmEnabled} onChange={setFcmEnabled} />
            </div>
            {fcmEnabled && (
              <div className="mt-4 p-4 bg-primary/10 border border-primary/30 rounded-lg">
                <p className="text-sm text-primary font-bold">✅ Push Notifications Enabled!</p>
                <p className="text-xs text-muted-foreground mt-1">
                  You can now configure all notification settings below.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notification Tone - Only show when Push is ON */}
        {fcmEnabled && (
          <Card className="glass-effect border-accent/30">
            <CardHeader className="border-b border-accent/20">
              <CardTitle className="text-foreground text-xl">Notification Tone</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {Object.entries(tones).map(([tone, config]) => (
                  <button
                    key={tone}
                    onClick={() => setMotivationTone(tone)}
                    className={`w-full p-6 rounded-xl border text-left transition-all duration-200 min-h-[80px] ${
                      motivationTone === tone
                        ? 'bg-primary/20 border-primary text-foreground shadow-lg shadow-primary/20 transform scale-105'
                        : 'bg-card border-border hover:bg-muted/50 hover:border-accent text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl">{config.emoji}</span>
                      <span className="font-bold text-xl">{config.label}</span>
                      {motivationTone === tone && <Check className="h-6 w-6 text-primary ml-auto" />}
                    </div>
                    <p className="text-base text-muted-foreground leading-relaxed">{config.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Frequency & Timing - Only show when Push is ON */}
        {fcmEnabled && (
          <Card className="glass-effect border-accent/30">
            <CardHeader className="border-b border-accent/20">
              <CardTitle className="text-foreground text-xl">Frequency & Timing</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Frequency Radio Group */}
              <div>
                <Label className="text-lg font-bold mb-3 block text-foreground">Frequency</Label>
                <div className="space-y-3">
                  {Object.entries(frequencies).map(([freq, config]) => (
                    <button
                      key={freq}
                      onClick={() => setNotificationFrequency(freq)}
                      className={`w-full p-5 rounded-xl border text-left transition-all duration-200 min-h-[70px] ${
                        notificationFrequency === freq
                          ? 'bg-primary/20 border-primary text-foreground shadow-lg shadow-primary/20 transform scale-105'
                          : 'bg-card border-border hover:bg-muted/50 hover:border-accent text-foreground'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-lg">{config.label}</div>
                          <div className="text-sm text-muted-foreground mt-1">{config.description}</div>
                        </div>
                        {notificationFrequency === freq && <Check className="h-6 w-6 text-primary" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Windows */}
              <div>
                <Label className="text-lg font-bold mb-3 block text-foreground">Time Windows</Label>
                <div className="space-y-3">
                  {timeWindowOptions.map((window) => (
                    <button
                      key={window.id}
                      onClick={() => toggleTimeWindow(window.id)}
                      className={`w-full p-5 rounded-xl border text-left transition-all duration-200 min-h-[70px] ${
                        timeWindows.includes(window.id)
                          ? 'bg-accent/20 border-accent text-foreground shadow-lg shadow-accent/20 transform scale-105'
                          : 'bg-card border-border hover:bg-muted/50 hover:border-accent text-foreground'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-lg">{window.label}</div>
                          <div className="text-base text-muted-foreground">{window.time}</div>
                        </div>
                        {timeWindows.includes(window.id) && (
                          <Check className="h-6 w-6 text-accent" />
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
          <Card className="glass-effect border-accent/30">
            <CardHeader className="border-b border-accent/20">
              <CardTitle className="flex items-center gap-2 text-foreground text-xl">
                <Vibrate className="h-6 w-6" />
                Vibration
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Vibrate on Reminder</p>
                  <p className="text-sm text-muted-foreground">
                    {vibrationEnabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
                <SimpleToggle checked={vibrationEnabled} onChange={setVibrationEnabled} />
              </div>

              {vibrationEnabled && (
                <div>
                  <Label className="text-lg font-bold mb-3 block text-foreground">Intensity</Label>
                  <div className="space-y-3">
                    {(['light', 'medium', 'heavy'] as const).map((intensity) => (
                      <button
                        key={intensity}
                        onClick={() => setVibrationIntensity(intensity)}
                        className={`w-full p-5 rounded-xl border text-left transition-all duration-200 capitalize min-h-[60px] ${
                          vibrationIntensity === intensity
                            ? 'bg-primary/20 border-primary text-foreground shadow-lg shadow-primary/20 transform scale-105'
                            : 'bg-card border-border hover:bg-muted/50 hover:border-accent text-foreground'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-lg">{intensity}</div>
                          {vibrationIntensity === intensity && <Check className="h-6 w-6 text-primary" />}
                        </div>
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
          <Card className="glass-effect border-accent/30">
            <CardHeader className="border-b border-accent/20">
              <CardTitle className="flex items-center gap-2 text-foreground text-xl">
                <MessageSquare className="h-6 w-6" />
                SMS Reminders
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">SMS Reminders</p>
                  <p className="text-sm text-muted-foreground">
                    {smsEnabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
                <SimpleToggle checked={smsEnabled} onChange={setSmsEnabled} />
              </div>

              {smsEnabled && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-lg font-bold mb-3 block text-foreground">Max per day</Label>
                    <div className="flex items-center gap-6">
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => setSmsMaxPerDay(Math.max(1, smsMaxPerDay - 1))}
                        disabled={smsMaxPerDay <= 1}
                        className="h-12 w-12 p-0"
                      >
                        -
                      </Button>
                      <span className="mx-4 font-bold text-2xl text-foreground">{smsMaxPerDay}</span>
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => setSmsMaxPerDay(Math.min(2, smsMaxPerDay + 1))}
                        disabled={smsMaxPerDay >= 2}
                        className="h-12 w-12 p-0"
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-destructive bg-destructive/10 p-3 rounded border border-destructive/30">
                    ⚠️ Maximum 2 SMS per day due to cost constraints
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Disabled State Message */}
        {!fcmEnabled && (
          <div className="text-center py-16 text-muted-foreground bg-muted/20 rounded-lg border border-border">
            <Bell className="h-20 w-20 mx-auto mb-6 opacity-50" />
            <p className="text-2xl font-bold mb-2">Push Notifications Disabled</p>
            <p className="text-lg">Enable push notifications to access all settings</p>
          </div>
        )}
      </div>
    </div>
  );
}