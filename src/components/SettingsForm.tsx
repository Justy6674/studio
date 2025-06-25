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
import { MotivationTone } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SlidersHorizontal, Sparkles, BellRing } from "lucide-react";
import { requestNotificationPermission, isNotificationSupported, showMotivationNotification } from "@/lib/notifications";

const availableTimes = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', 
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', 
  '18:00', '19:00', '20:00', '21:00', '22:00'
];

// Define a type for the settings state
interface Settings {
  name: string;
  hydrationGoal: number;
  sipAmount: number;
  phoneNumber: string;
  smsEnabled: boolean;
  motivationTone: MotivationTone;
  reminderPreset: string;
  reminderTimes: Record<string, boolean>;
  pushNotifications: boolean;
  milestoneAnimations: boolean;
}

// Define prop types for sub-components
interface ProfileSettingsProps {
  settings: Settings;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

interface NotificationSettingsProps {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  handleTimeToggle: (time: string) => void;
  handleTestSMS: () => void;
  testingSMS: boolean;
  notificationPermission: NotificationPermission;
  handleRequestNotificationPermission: () => void;
}

interface AppSettingsProps {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ settings, handleInputChange }) => (
    <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><SlidersHorizontal className="w-5 h-5" /> Profile & Goals</CardTitle>
          <CardDescription>
            <p className="text-muted-foreground">Adjust your daily goals and sips.</p>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" value={settings.name} onChange={handleInputChange} placeholder="Your first name" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hydrationGoal">Daily Hydration Goal (ml)</Label>
              <Input id="hydrationGoal" name="hydrationGoal" type="number" value={settings.hydrationGoal} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sipAmount">Default Sip Amount (ml)</Label>
              <Input id="sipAmount" name="sipAmount" type="number" value={settings.sipAmount} onChange={handleInputChange} />
            </div>
          </div>
        </CardContent>
      </Card>
);

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ settings, setSettings, handleTimeToggle, handleTestSMS, testingSMS, notificationPermission, handleRequestNotificationPermission }) => (
    <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BellRing className="w-5 h-5" /> Notifications & Reminders</CardTitle>
          <CardDescription>
            <p className="text-muted-foreground">Stay on track with SMS and push notifications.</p>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Push Notifications */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="pushNotifications" className="font-medium">Enable Push Notifications</Label>
              <p className="text-sm text-muted-foreground">Get motivational nudges directly on your device.</p>
            </div>
            <Checkbox
              id="pushNotifications"
              checked={settings.pushNotifications && notificationPermission === 'granted'}
              disabled={notificationPermission === 'denied'}
              onCheckedChange={(checked) => {
                if (checked) {
                  if (notificationPermission === 'granted') {
                    setSettings(prev => ({ ...prev, pushNotifications: true }));
                  } else {
                    handleRequestNotificationPermission();
                  }
                } else {
                  setSettings(prev => ({ ...prev, pushNotifications: false }));
                }
              }}
            />
          </div>
          {notificationPermission === 'denied' && (
            <p className="text-sm text-destructive">You have blocked push notifications. Please enable them in your browser settings.</p>
          )}

          {/* SMS Notifications */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="smsEnabled" name="smsEnabled" checked={settings.smsEnabled} onCheckedChange={(checked) => setSettings(prev => ({ ...prev, smsEnabled: !!checked }))} />
              <Label htmlFor="smsEnabled">Enable SMS Reminders</Label>
            </div>
            {settings.smsEnabled && (
              <div className="space-y-4 pl-6 border-l-2">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <div className="flex gap-2">
                    <Input id="phoneNumber" name="phoneNumber" type="tel" value={settings.phoneNumber} onChange={(e) => setSettings(prev => ({ ...prev, phoneNumber: e.target.value }))} placeholder="+15551234567" />
                    <Button variant="outline" onClick={handleTestSMS} disabled={testingSMS}>
                      {testingSMS ? "Sending..." : "Test"}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Reminder Times (Max 2)</Label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {availableTimes.map(time => (
                      <Button
                        key={time}
                        variant={settings.reminderTimes[time] ? "default" : "outline"}
                        onClick={() => handleTimeToggle(time)}
                        className="text-xs"
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
);

const reminderTones = [
  { value: 'kind', label: 'Kind &amp; Gentle' },
  { value: 'strict', label: 'Strict &amp; Direct' },
  { value: 'funny', label: 'Funny &amp; Lighthearted' },
  { value: 'kick', label: 'Kick My Ass!' },
];

const AppSettings: React.FC<AppSettingsProps> = ({ settings, setSettings }) => (
    <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5" /> App & AI Experience</CardTitle>
          <CardDescription>
            <p className="text-muted-foreground">Customize how the app and AI assistant behave.</p>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">


          {/* Milestone Animations */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="milestoneAnimations">Milestone Animations</Label>
              <p className="text-sm text-muted-foreground">Enable celebratory animations for hydration milestones.</p>
            </div>
            <Checkbox 
              id="milestoneAnimations" 
              checked={settings.milestoneAnimations} 
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, milestoneAnimations: !!checked }))} 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivationTone">Reminder Tone</Label>
            <Select 
              value={settings.motivationTone} 
              onValueChange={(value) => setSettings(prev => ({ ...prev, motivationTone: value as MotivationTone }))}
            >
              <SelectTrigger id="motivationTone">
                <SelectValue placeholder="Select a reminder tone" />
              </SelectTrigger>
              <SelectContent>
                {reminderTones.map(tone => (
                  <SelectItem key={tone.value} value={tone.value}>
                    {tone.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">Choose the style of your AI motivational messages and reminders.</p>
          </div>
        </CardContent>
      </Card>
);

export function SettingsForm() {
  const { user, userProfile, updateUserProfileData } = useAuth();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState<Settings>({
    name: '',
    hydrationGoal: 2000,
    sipAmount: 50,
    phoneNumber: '',
    smsEnabled: false,
    motivationTone: 'motivational',
    reminderPreset: 'meals',
    reminderTimes: {} as Record<string, boolean>,
    pushNotifications: false,
    milestoneAnimations: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [testingSMS, setTestingSMS] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');


  useEffect(() => {
    // Load settings from Firestore will be implemented in future update
    return () => {
      // Cleanup function
    };
  }, []);

  useEffect(() => {
    if (userProfile) {
      setSettings({
        name: userProfile.name || '',
        hydrationGoal: userProfile.hydrationGoal || 2000,
        sipAmount: userProfile.sipAmount || 50,
        phoneNumber: userProfile.phoneNumber || '',
        smsEnabled: userProfile.smsEnabled || false,
        motivationTone: userProfile.motivationTone || 'motivational',
        reminderPreset: 'custom', // Default to custom since we're loading existing times
        reminderTimes: userProfile.reminderTimes || { '08:00': true, '12:00': true, '18:00': true },
        pushNotifications: userProfile.pushNotifications || false,
        milestoneAnimations: userProfile.milestoneAnimations || true,
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

  const handleTimeToggle = (time: string) => {
    const currentCount = Object.values(settings.reminderTimes).filter(Boolean).length;
    const isCurrentlyEnabled = settings.reminderTimes[time];
    
    // Enforce 2 SMS limit
    if (!isCurrentlyEnabled && currentCount >= 2) {
      toast({
        variant: "destructive",
        title: "SMS Limit Reached",
        description: "Maximum 2 SMS reminders per day to keep costs down and avoid being spammy.",
      });
      return;
    }
    
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

    try {
      const permission = await requestNotificationPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        toast({
          title: "Notifications Enabled! 🔔",
          description: "You'll now receive motivational messages as push notifications.",
        });
        showMotivationNotification("Test Notification", "This is how you'll get AI motivation!");
      } else if (permission === 'denied') {
        toast({
          variant: "destructive",
          title: "Notifications Blocked",
          description: "Please enable notifications in your browser settings to use this feature.",
        });
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast({
        variant: "destructive",
        title: "Permission Error",
        description: "Could not request notification permission.",
      });
    } finally {
      // No cleanup needed for notification permission request
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        variant: "destructive",
        title: "Not Logged In",
        description: "You must be logged in to save settings.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        name: settings.name,
        hydrationGoal: settings.hydrationGoal,
        sipAmount: settings.sipAmount,
        phoneNumber: settings.phoneNumber,
        smsEnabled: settings.smsEnabled,
        motivationTone: settings.motivationTone as MotivationTone,
        reminderTimes: settings.reminderTimes,
        pushNotifications: settings.pushNotifications,
        milestoneAnimations: settings.milestoneAnimations,
      });

      // Update local context
      updateUserProfileData({
        name: settings.name,
        hydrationGoal: settings.hydrationGoal,
        sipAmount: settings.sipAmount,
        phoneNumber: settings.phoneNumber,
        smsEnabled: settings.smsEnabled,
        motivationTone: settings.motivationTone as MotivationTone,
        reminderTimes: settings.reminderTimes,
        pushNotifications: settings.pushNotifications,
        milestoneAnimations: settings.milestoneAnimations,
      });

      toast({
        title: "Settings Saved! ✅",
        description: "Your preferences have been updated.",
      });
    } catch (error) {
      console.error("Error updating settings:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not save your settings. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!userProfile) {
    return (
      <Card>
        <CardHeader><CardTitle>Loading Settings...</CardTitle></CardHeader>
        <CardContent>
          <p>Please wait while we load your personalized settings.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <ProfileSettings settings={settings} handleInputChange={handleInputChange} />
      
      <NotificationSettings
        settings={settings}
        setSettings={setSettings}
        handleTimeToggle={handleTimeToggle}
        handleTestSMS={handleTestSMS}
        testingSMS={testingSMS}
        notificationPermission={notificationPermission}
        handleRequestNotificationPermission={handleRequestNotificationPermission}
      />

      <AppSettings settings={settings} setSettings={setSettings} />

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
