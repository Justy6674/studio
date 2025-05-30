"use client";

import type { FormEvent} from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserProfile } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SlidersHorizontal, Palette, Clock, Phone, TestTube, Sparkles, Bell, BellRing } from "lucide-react";
import { requestNotificationPermission, isNotificationSupported, showMotivationNotification } from "@/lib/notifications";

const aiTones = [
  { value: 'motivational', label: 'Motivational' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'professional', label: 'Professional' },
  { value: 'funny', label: 'Funny' },
  { value: 'encouraging', label: 'Encouraging' },
];

const reminderPresets = [
  { value: 'hourly', label: 'Every Hour (8AM-8PM)', times: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'] },
  { value: 'every2h', label: 'Every 2 Hours', times: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'] },
  { value: 'meals', label: 'Meal Times', times: ['08:00', '12:00', '18:00'] },
  { value: 'custom', label: 'Custom Times', times: [] },
];

const availableTimes = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', 
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', 
  '18:00', '19:00', '20:00', '21:00', '22:00'
];

export function SettingsForm() {
  const { user, userProfile, updateUserProfileData } = useAuth();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState({
    name: '',
    hydrationGoal: 2000,
    sipAmount: 50,
    phoneNumber: '',
    smsEnabled: false,
    aiTone: 'motivational',
    motivationTone: 'Default',
    motivationFrequency: 'Every log',
    reminderPreset: 'meals',
    reminderTimes: {} as Record<string, boolean>,
    pushNotifications: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [testingSMS, setTestingSMS] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [requestingPermission, setRequestingPermission] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setSettings({
        name: userProfile.name || '',
        hydrationGoal: userProfile.hydrationGoal || 2000,
        sipAmount: userProfile.sipAmount || 50,
        phoneNumber: userProfile.phoneNumber || '',
        smsEnabled: userProfile.smsEnabled || false,
        aiTone: userProfile.aiTone || 'motivational',
        motivationTone: userProfile.motivationTone || 'Default',
        motivationFrequency: userProfile.motivationFrequency || 'Every log',
        reminderPreset: 'custom', // Default to custom since we're loading existing times
        reminderTimes: userProfile.reminderTimes || { '08:00': true, '12:00': true, '18:00': true },
        pushNotifications: userProfile.pushNotifications || false,
      });
    }
  }, [userProfile]);

  // Check notification permission on mount
  useEffect(() => {
    if (isNotificationSupported()) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : (name === 'hydrationGoal' || name === 'sipAmount' ? parseInt(value) || 0 : value)
    }));
  };

  const handlePresetChange = (preset: string) => {
    const presetData = reminderPresets.find(p => p.value === preset);
    if (presetData && preset !== 'custom') {
      const newTimes: Record<string, boolean> = {};
      presetData.times.forEach(time => {
        newTimes[time] = true;
      });
      setSettings(prev => ({
        ...prev,
        reminderPreset: preset,
        reminderTimes: newTimes,
      }));
    } else {
      setSettings(prev => ({ ...prev, reminderPreset: preset }));
    }
  };

  const handleTimeToggle = (time: string) => {
    setSettings(prev => ({
      ...prev,
      reminderPreset: 'custom',
      reminderTimes: {
        ...prev.reminderTimes,
        [time]: !prev.reminderTimes[time],
      }
    }));
  };

  const handleTestSMS = async () => {
    if (!settings.phoneNumber) {
      toast({
        variant: "destructive",
        title: "Phone Number Required",
        description: "Please enter a phone number to test SMS.",
      });
      return;
    }

    setTestingSMS(true);
    try {
      const response = await fetch('/api/sms/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: settings.phoneNumber }),
      });

      if (response.ok) {
        toast({
          title: "Test SMS Sent! 📱",
          description: "Check your phone for the test message.",
        });
      } else {
        throw new Error('Failed to send test SMS');
      }
    } catch (error) {
      console.error('Error sending test SMS:', error);
      toast({
        variant: "destructive",
        title: "SMS Test Failed",
        description: "Could not send test SMS. Please check your phone number.",
      });
    } finally {
      setTestingSMS(false);
    }
  };

  const handleRequestNotificationPermission = async () => {
    setRequestingPermission(true);
    try {
      const permission = await requestNotificationPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        toast({
          title: "Notifications Enabled! 🔔",
          description: "You'll now receive motivational messages as push notifications.",
        });
        
        // Show a test notification
        await showMotivationNotification(
          "Test notification! Your hydration coach is ready to motivate you! 💧",
          settings.motivationTone
        );
      } else {
        toast({
          variant: "destructive",
          title: "Permission Denied",
          description: "Push notifications were not enabled. You can enable them in your browser settings.",
        });
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to request notification permission.",
      });
    } finally {
      setRequestingPermission(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in." });
      return;
    }

    setIsLoading(true);
    try {
      const updatedProfile: Partial<UserProfile> = {
        name: settings.name,
        hydrationGoal: settings.hydrationGoal,
        sipAmount: settings.sipAmount,
        phoneNumber: settings.phoneNumber,
        smsEnabled: settings.smsEnabled,
        aiTone: settings.aiTone,
        motivationTone: settings.motivationTone,
        motivationFrequency: settings.motivationFrequency,
        reminderTimes: settings.reminderTimes,
        pushNotifications: settings.pushNotifications,
      };

      // Update Firestore
      await updateDoc(doc(db, "users", user.uid), updatedProfile);
      
      // Update local context
      await updateUserProfileData(updatedProfile);

      toast({ 
        title: "Settings Saved! ✅", 
        description: "Your preferences have been updated successfully." 
      });
    } catch (error: any) {
      console.error("Error updating settings:", error);
      toast({ 
        variant: "destructive", 
        title: "Error Saving Settings", 
        description: error.message || "Failed to update settings. Please try again." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedTimes = Object.keys(settings.reminderTimes).filter(time => settings.reminderTimes[time]);

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl text-slate-200">
          <SlidersHorizontal className="h-7 w-7 text-hydration-400" />
          Your Preferences
        </CardTitle>
        <CardDescription className="text-slate-400">
          Customise your Water4WeightLoss experience and notifications.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
              <div className="p-1 bg-hydration-400/20 rounded">
                <SlidersHorizontal className="h-4 w-4 text-hydration-400" />
              </div>
              Personal Settings
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-300">Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={settings.name}
                onChange={handleInputChange}
                className="bg-slate-700 border-slate-600 text-slate-100"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hydrationGoal" className="text-slate-300">Daily Hydration Goal (ml)</Label>
              <Input
                id="hydrationGoal"
                name="hydrationGoal"
                type="number"
                value={settings.hydrationGoal}
                onChange={handleInputChange}
                min="500"
                max="5000"
                step="100"
                className="bg-slate-700 border-slate-600 text-slate-100"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sipAmount" className="text-slate-300">Quick Sip Amount (ml)</Label>
              <Input
                id="sipAmount"
                name="sipAmount"
                type="number"
                value={settings.sipAmount}
                onChange={handleInputChange}
                min="10"
                max="500"
                step="10"
                className="bg-slate-700 border-slate-600 text-slate-100"
                disabled={isLoading}
              />
              <p className="text-xs text-slate-400">
                Amount logged when using the quick "Sip" button
              </p>
            </div>
          </div>

          {/* AI Motivation Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-hydration-400" />
                AI Motivation Settings
              </CardTitle>
              <CardDescription>
                Customise how and when you receive motivational messages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Motivation Tone */}
              <div className="space-y-2">
                <Label htmlFor="motivationTone" className="text-slate-200">
                  Motivation Tone
                </Label>
                <Select 
                  value={settings.motivationTone} 
                  onValueChange={(value) => setSettings(prev => ({ ...prev, motivationTone: value }))}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-200">
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Clinical">Clinical/Educational - Health facts & scientific benefits</SelectItem>
                    <SelectItem value="Funny">Crass/Funny - Humour, puns & playful language</SelectItem>
                    <SelectItem value="Sarcastic">Sarcastic - Witty, clever & cheeky motivation</SelectItem>
                    <SelectItem value="Warm">Warm - Caring, supportive & encouraging</SelectItem>
                    <SelectItem value="Default">Default - Balanced & friendly</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-slate-400">
                  Choose the personality style for your AI motivation coach
                </p>
              </div>

              {/* Motivation Frequency */}
              <div className="space-y-2">
                <Label htmlFor="motivationFrequency" className="text-slate-200">
                  Motivation Frequency
                </Label>
                <Select 
                  value={settings.motivationFrequency} 
                  onValueChange={(value) => setSettings(prev => ({ ...prev, motivationFrequency: value }))}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-200">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Every log">After every water log</SelectItem>
                    <SelectItem value="Every few logs">Every 3-4 logs</SelectItem>
                    <SelectItem value="Once per day">Once per day maximum</SelectItem>
                    <SelectItem value="Goal achieved">Only when daily goal is reached</SelectItem>
                    <SelectItem value="Never">Never (manual refresh only)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-slate-400">
                  Control how often you receive motivational messages
                </p>
              </div>

              {/* Push Notifications */}
              <div className="space-y-4 p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                <div className="space-y-2">
                  <Label className="text-slate-200 flex items-center gap-2">
                    <span>📱 Push Notifications</span>
                    {notificationPermission === 'granted' && (
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                        Enabled
                      </span>
                    )}
                    {notificationPermission === 'denied' && (
                      <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
                        Blocked
                      </span>
                    )}
                  </Label>
                  
                  {!isNotificationSupported() ? (
                    <div className="text-sm text-slate-400 p-3 bg-slate-600/50 rounded">
                      ⚠️ Push notifications are not supported in this browser.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="pushNotifications"
                          checked={settings.pushNotifications && notificationPermission === 'granted'}
                          onCheckedChange={(checked) => setSettings(prev => ({ ...prev, pushNotifications: !!checked }))}
                          disabled={isLoading || notificationPermission !== 'granted'}
                        />
                        <Label htmlFor="pushNotifications" className="text-slate-300">
                          Enable motivational push notifications
                        </Label>
                      </div>
                      
                      {notificationPermission !== 'granted' && (
                        <Button
                          type="button"
                          onClick={handleRequestNotificationPermission}
                          disabled={requestingPermission}
                          variant="outline"
                          size="sm"
                          className="bg-slate-700 border-slate-600 hover:bg-slate-600"
                        >
                          {requestingPermission ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                              Requesting...
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <BellRing className="h-4 w-4" />
                              {notificationPermission === 'denied' ? 'Re-enable' : 'Enable'} Notifications
                            </div>
                          )}
                        </Button>
                      )}
                      
                      <p className="text-xs text-slate-400">
                        {notificationPermission === 'granted' 
                          ? "✅ You'll receive motivational messages as push notifications based on your frequency settings."
                          : notificationPermission === 'denied'
                          ? "❌ Notifications are blocked. Click above to request permission again or enable them in your browser settings."
                          : "🔔 Allow notifications to receive motivational messages on your device."
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
              <div className="p-1 bg-brown-400/20 rounded">
                <Palette className="h-4 w-4 text-brown-400" />
              </div>
              AI Motivation
            </h3>
            
            <div className="space-y-2">
              <Label className="text-slate-300">AI Tone</Label>
              <Select
                value={settings.aiTone}
                onValueChange={(value) => setSettings(prev => ({ ...prev, aiTone: value }))}
                disabled={isLoading}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {aiTones.map((tone) => (
                    <SelectItem key={tone.value} value={tone.value} className="text-slate-100">
                      {tone.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* SMS Reminders */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
              <div className="p-1 bg-slate-500/20 rounded">
                <Phone className="h-4 w-4 text-slate-400" />
              </div>
              SMS Reminders
            </h3>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="text-slate-300">Phone Number</Label>
              <div className="flex gap-2">
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={settings.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="+61412345678"
                  className="bg-slate-700 border-slate-600 text-slate-100 flex-1"
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestSMS}
                  disabled={testingSMS || !settings.phoneNumber}
                  className="bg-slate-700 border-slate-600 hover:bg-slate-600"
                >
                  {testingSMS ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Testing...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <TestTube className="h-4 w-4" />
                      Test
                    </div>
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="smsEnabled"
                name="smsEnabled"
                checked={settings.smsEnabled}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, smsEnabled: !!checked }))}
                disabled={isLoading}
              />
              <Label htmlFor="smsEnabled" className="text-slate-300">
                Enable SMS reminders
              </Label>
            </div>

            {settings.smsEnabled && (
              <div className="space-y-4 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                <div className="space-y-2">
                  <Label className="text-slate-300">Reminder Schedule</Label>
                  <Select
                    value={settings.reminderPreset}
                    onValueChange={handlePresetChange}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {reminderPresets.map((preset) => (
                        <SelectItem key={preset.value} value={preset.value} className="text-slate-100">
                          {preset.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {settings.reminderPreset === 'custom' && (
                  <div className="space-y-2">
                    <Label className="text-slate-300">Custom Times</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {availableTimes.map((time) => (
                        <div key={time} className="flex items-center space-x-2">
                          <Checkbox
                            id={`time-${time}`}
                            checked={settings.reminderTimes[time] || false}
                            onCheckedChange={() => handleTimeToggle(time)}
                            disabled={isLoading}
                          />
                          <Label htmlFor={`time-${time}`} className="text-sm text-slate-300">
                            {time}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-sm text-slate-400">
                  Selected times: {selectedTimes.length > 0 ? selectedTimes.join(', ') : 'None'}
                </div>
              </div>
            )}
          </div>

          <CardFooter className="px-0">
            <Button 
              type="submit" 
              disabled={isLoading} 
              className="w-full bg-hydration-500 hover:bg-hydration-600 text-white"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Saving Settings...
                </div>
              ) : (
                "Save Settings"
              )}
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}
