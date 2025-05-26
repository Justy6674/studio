
"use client";

import type { FormEvent} from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
// import { updateUserSettings as updateUserSettingsAction } from "@/app/actions/user"; // Using Firebase Function now
import { getFunctions, httpsCallable } from "firebase/functions";
import type { UserSettings, MotivationTone, availableTones, UserPreferences } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SlidersHorizontal, Palette } from "lucide-react";

const defaultReminderTimes = {
  '08:00': false,
  '12:00': true,
  '16:00': false,
};

const defaultPreferences: UserPreferences = {
  tone: 'default',
};

export function SettingsForm() {
  const { user, updateUserProfileData, loading: authLoading, fetchUserProfile } = useAuth();
  const { toast } = useToast();
  const firebaseFunctions = getFunctions(); // Initialize Firebase Functions
  
  const [settings, setSettings] = useState<UserSettings>({
    name: user?.name || user?.displayName || "",
    hydrationGoal: 2000,
    phoneNumber: "",
    reminderTimes: defaultReminderTimes,
    preferences: defaultPreferences,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setSettings({
        name: user.name || user.displayName || "",
        hydrationGoal: user.hydrationGoal || 2000,
        phoneNumber: user.phoneNumber || "",
        reminderTimes: user.reminderTimes || defaultReminderTimes,
        preferences: user.preferences || defaultPreferences,
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: name === 'hydrationGoal' ? parseInt(value) || 0 : value }));
  };

  const handleReminderChange = (time: keyof UserSettings['reminderTimes']) => {
    setSettings(prev => ({
      ...prev,
      reminderTimes: {
        ...(prev.reminderTimes || defaultReminderTimes),
        [time]: !prev.reminderTimes![time],
      }
    }));
  };

  const handleToneChange = (tone: MotivationTone) => {
    setSettings(prev => ({
      ...prev,
      preferences: {
        ...(prev.preferences || defaultPreferences),
        tone: tone,
      }
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in." });
      return;
    }
    setIsLoading(true);

    const settingsToSave: Partial<UserSettings> = {
        name: settings.name,
        hydrationGoal: settings.hydrationGoal,
        phoneNumber: settings.phoneNumber,
        reminderTimes: settings.reminderTimes,
        preferences: settings.preferences,
    };

    try {
        const updateUserSettingsFn = httpsCallable(firebaseFunctions, 'updateUserSettings');
        const result = await updateUserSettingsFn(settingsToSave) as any; // Cast to any if specific result type isn't defined

        if (result.data.success) {
            // Update local AuthContext state optimistically or by re-fetching
            // For simplicity, we'll update local state. For robustness, re-fetch or ensure function returns full updated profile.
            if (user) {
                // await fetchUserProfile(user); // Re-fetch to get the latest profile
                updateUserProfileData(user.uid, settingsToSave); // Update local context
            }
            toast({ title: "Success!", description: "Settings updated." });
        } else {
            throw new Error(result.data.message || "Failed to update settings via function.");
        }
    } catch (error: any) {
        console.error("Error calling updateUserSettings function:", error);
        toast({ variant: "destructive", title: "Error", description: error.message || "Failed to update settings." });
    }

    setIsLoading(false);
  };

  if (authLoading && !user) {
      return <Card><CardHeader><CardTitle>Loading settings...</CardTitle></CardHeader><CardContent><p>Please wait.</p></CardContent></Card>
  }
  
  // Dynamically import availableTones or ensure it's correctly typed/imported
  const tonesForSelect: MotivationTone[] = ["default", "funny", "crass", "rude", "sarcastic", "kind", "motivational", "clinical"];


  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <SlidersHorizontal className="h-7 w-7 text-primary" />
          Your Preferences
        </CardTitle>
        <CardDescription>Customize your Water4WeightLoss experience.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-base">Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={settings.name || ""}
              onChange={handleInputChange}
              className="text-lg h-12"
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hydrationGoal" className="text-base">Daily Hydration Goal (ml)</Label>
            <Input
              id="hydrationGoal"
              name="hydrationGoal"
              type="number"
              value={settings.hydrationGoal}
              onChange={handleInputChange}
              min="500"
              step="100"
              className="text-lg h-12"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber" className="text-base">Phone Number (for SMS reminders)</Label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              value={settings.phoneNumber || ""}
              onChange={handleInputChange}
              placeholder="e.g., +12345678900"
              className="text-lg h-12"
              disabled={isLoading}
            />
             <p className="text-sm text-muted-foreground">
              Optional. Used for sending SMS reminders if enabled.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tone" className="text-base flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary/80" />
              AI Motivation Tone
            </Label>
            <Select
              value={settings.preferences?.tone || 'default'}
              onValueChange={(value) => handleToneChange(value as MotivationTone)}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full text-lg h-12">
                <SelectValue placeholder="Select a tone" />
              </SelectTrigger>
              <SelectContent>
                {tonesForSelect.map((tone) => (
                  <SelectItem key={tone} value={tone} className="capitalize">
                    {tone.charAt(0).toUpperCase() + tone.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Choose the style of motivational messages you'd like to receive.
            </p>
          </div>


          <div className="space-y-4">
            <Label className="text-base block mb-2">SMS Reminder Times</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(Object.keys(settings.reminderTimes || defaultReminderTimes) as Array<keyof UserSettings['reminderTimes']>).map((time) => (
                <div key={time} className="flex items-center space-x-3 p-4 bg-secondary/50 rounded-lg">
                  <Checkbox
                    id={`reminder-${time}`}
                    checked={settings.reminderTimes ? settings.reminderTimes[time] : false}
                    onCheckedChange={() => handleReminderChange(time)}
                    disabled={isLoading || !settings.phoneNumber}
                  />
                  <Label htmlFor={`reminder-${time}`} className="text-base font-medium">
                    {time}
                  </Label>
                </div>
              ))}
            </div>
            {!settings.phoneNumber && <p className="text-sm text-amber-500">Enter a phone number to enable SMS reminders.</p>}
          </div>
          
          <Button type="submit" className="w-full h-12 text-lg" disabled={isLoading || authLoading}>
            {isLoading ? "Saving..." : "Save Settings"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
