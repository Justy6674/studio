"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Palette, 
  Target,
  Phone,
  Save,
  Check,
  AlertCircle,
  Smartphone
} from "lucide-react";

interface SettingsData {
  name: string;
  hydrationGoal: number;
  sipAmount: number;
  phoneNumber: string;
  smsEnabled: boolean;
  motivationTone: string;
  reminderTimes: Record<string, boolean>;
  pushNotifications: boolean;
  milestoneAnimations: boolean;
}

const motivationTones = [
  { value: 'kind', label: 'Kind & Gentle', description: 'Encouraging and supportive messages' },
  { value: 'strict', label: 'Strict & Direct', description: 'Direct and firm reminders' },
  { value: 'funny', label: 'Funny & Lighthearted', description: 'Humorous and playful messages' },
  { value: 'supportive', label: 'Supportive Coach', description: 'Like having a personal trainer' },
];

const reminderTimeSlots = [
  { value: '08:00', label: '8:00 AM', description: 'Morning boost' },
  { value: '12:00', label: '12:00 PM', description: 'Lunch reminder' },
  { value: '16:00', label: '4:00 PM', description: 'Afternoon pick-me-up' },
  { value: '20:00', label: '8:00 PM', description: 'Evening wind-down' },
];

export default function SettingsPage() {
  const { user, userProfile, updateUserProfileData } = useAuth();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState<SettingsData>({
    name: '',
    hydrationGoal: 2000,
    sipAmount: 50,
    phoneNumber: '',
    smsEnabled: false,
    motivationTone: 'kind',
    reminderTimes: {},
    pushNotifications: false,
    milestoneAnimations: true,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [testingSMS, setTestingSMS] = useState(false);

  // Load user settings
  useEffect(() => {
    if (userProfile) {
      const newSettings = {
        name: userProfile.name || '',
        hydrationGoal: userProfile.hydrationGoal || 2000,
        sipAmount: userProfile.sipAmount || 50,
        phoneNumber: userProfile.phoneNumber || '',
        smsEnabled: userProfile.smsEnabled || false,
        motivationTone: userProfile.motivationTone || 'kind',
        reminderTimes: userProfile.reminderTimes || { '08:00': true, '12:00': true },
        pushNotifications: userProfile.pushNotifications || false,
        milestoneAnimations: userProfile.milestoneAnimations !== false,
      };
      setSettings(newSettings);
    }
  }, [userProfile]);

  const updateSetting = (key: keyof SettingsData, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const toggleReminderTime = (time: string) => {
    const currentTimes = Object.keys(settings.reminderTimes).filter(
      t => settings.reminderTimes[t]
    );
    
    if (settings.reminderTimes[time] && currentTimes.length <= 1) {
      toast({
        variant: "destructive",
        title: "Minimum Required",
        description: "Keep at least one reminder time active.",
      });
      return;
    }
    
    if (!settings.reminderTimes[time] && currentTimes.length >= 2) {
      toast({
        variant: "destructive",
        title: "Maximum Reached",
        description: "You can have up to 2 SMS reminders per day.",
      });
      return;
    }

    setSettings(prev => ({
      ...prev,
      reminderTimes: {
        ...prev.reminderTimes,
        [time]: !prev.reminderTimes[time],
      }
    }));
    setHasChanges(true);
  };

  const testSMS = async () => {
    if (!settings.phoneNumber) {
      toast({
        variant: "destructive",
        title: "Phone Number Required",
        description: "Please enter your phone number first.",
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
          title: "Test Message Sent! 📱",
          description: "Check your phone for the test message.",
        });
      } else {
        throw new Error('Failed to send');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Test Failed",
        description: "Could not send test message. Check your number.",
      });
    } finally {
      setTestingSMS(false);
    }
  };

  const saveSettings = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, settings as any);
      await updateUserProfileData(settings);

      setHasChanges(false);
      toast({
        title: "Settings Saved! ✅",
        description: "Your preferences have been updated successfully.",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "Could not save your settings. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const activeReminderCount = Object.values(settings.reminderTimes).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <SettingsIcon className="h-8 w-8 text-primary" />
            Settings
          </h1>
          <p className="text-muted-foreground">Customize your hydration tracking experience</p>
        </div>
        
        <Button 
          onClick={saveSettings} 
          disabled={!hasChanges || isLoading}
          className="w-full md:w-auto"
        >
          {isLoading ? (
            "Saving..."
          ) : hasChanges ? (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              All Saved
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile & Goals
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Preferences
          </TabsTrigger>
        </TabsList>

        {/* Profile & Goals Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  value={settings.name}
                  onChange={(e) => updateSetting('name', e.target.value)}
                  placeholder="Enter your name"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Hydration Goals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hydrationGoal">Daily Goal (ml)</Label>
                  <Input
                    id="hydrationGoal"
                    type="number"
                    min="500"
                    max="5000"
                    step="100"
                    value={settings.hydrationGoal}
                    onChange={(e) => updateSetting('hydrationGoal', parseInt(e.target.value) || 2000)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Recommended: 2000-3000ml per day
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sipAmount">Default Sip (ml)</Label>
                  <Input
                    id="sipAmount"
                    type="number"
                    min="10"
                    max="500"
                    step="10"
                    value={settings.sipAmount}
                    onChange={(e) => updateSetting('sipAmount', parseInt(e.target.value) || 50)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Quick-add amount for logging
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                SMS Reminders
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Enable SMS Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Get text message reminders to stay hydrated
                  </p>
                </div>
                <Switch
                  checked={settings.smsEnabled}
                  onCheckedChange={(checked) => updateSetting('smsEnabled', checked)}
                />
              </div>

              {settings.smsEnabled && (
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <div className="flex gap-2">
                      <Input
                        id="phoneNumber"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={settings.phoneNumber}
                        onChange={(e) => updateSetting('phoneNumber', e.target.value)}
                        className="flex-1"
                      />
                      <Button 
                        variant="outline" 
                        onClick={testSMS}
                        disabled={testingSMS || !settings.phoneNumber}
                      >
                        {testingSMS ? "Sending..." : "Test"}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Reminder Times</Label>
                      <Badge variant="secondary">
                        {activeReminderCount}/2 selected
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {reminderTimeSlots.map((slot) => (
                        <div
                          key={slot.value}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            settings.reminderTimes[slot.value]
                              ? 'bg-primary/10 border-primary'
                              : 'bg-background border-border hover:bg-muted/50'
                          }`}
                          onClick={() => toggleReminderTime(slot.value)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{slot.label}</div>
                              <div className="text-xs text-muted-foreground">{slot.description}</div>
                            </div>
                            <div className={`w-4 h-4 rounded-full border-2 ${
                              settings.reminderTimes[slot.value]
                                ? 'bg-primary border-primary'
                                : 'border-muted-foreground'
                            }`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

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
                  <Label>Browser Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notifications in your browser
                  </p>
                </div>
                <Switch
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) => updateSetting('pushNotifications', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Motivation Style</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {motivationTones.map((tone) => (
                  <div
                    key={tone.value}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      settings.motivationTone === tone.value
                        ? 'bg-primary/10 border-primary'
                        : 'bg-background border-border hover:bg-muted/50'
                    }`}
                    onClick={() => updateSetting('motivationTone', tone.value)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{tone.label}</div>
                        <div className="text-sm text-muted-foreground">{tone.description}</div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        settings.motivationTone === tone.value
                          ? 'bg-primary border-primary'
                          : 'border-muted-foreground'
                      }`} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>App Experience</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Milestone Animations</Label>
                  <p className="text-sm text-muted-foreground">
                    Show celebration animations when you hit goals
                  </p>
                </div>
                <Switch
                  checked={settings.milestoneAnimations}
                  onCheckedChange={(checked) => updateSetting('milestoneAnimations', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save reminder */}
      {hasChanges && (
        <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:bottom-6 z-50">
          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                <div className="flex-1">
                  <p className="font-medium text-orange-900 dark:text-orange-100">
                    You have unsaved changes
                  </p>
                  <p className="text-sm text-orange-700 dark:text-orange-200">
                    Click "Save Changes" to apply your settings
                  </p>
                </div>
                <Button 
                  size="sm" 
                  onClick={saveSettings}
                  disabled={isLoading}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  Save Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
