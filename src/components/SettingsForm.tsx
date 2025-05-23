"use client";

import type { FormEvent} from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { updateUserSettings } from "@/app/actions/user";
import type { UserSettings } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SlidersHorizontal } from "lucide-react";

const defaultReminderTimes = {
  '08:00': false,
  '12:00': true,
  '16:00': false,
};

export function SettingsForm() {
  const { user, updateUserProfileData, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState<UserSettings>({
    hydrationGoal: 2000,
    phoneNumber: "",
    reminderTimes: defaultReminderTimes,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setSettings({
        hydrationGoal: user.hydrationGoal || 2000,
        phoneNumber: user.phoneNumber || "",
        reminderTimes: user.reminderTimes || defaultReminderTimes,
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
        // This is for top-level checkboxes if any, not reminderTimes
    } else if (name === 'hydrationGoal' || name === 'phoneNumber') {
        setSettings(prev => ({ ...prev, [name]: name === 'hydrationGoal' ? parseInt(value) || 0 : value }));
    }
  };

  const handleReminderChange = (time: keyof UserSettings['reminderTimes']) => {
    setSettings(prev => ({
      ...prev,
      reminderTimes: {
        ...prev.reminderTimes,
        [time]: !prev.reminderTimes[time],
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
    const result = await updateUserSettings(user.uid, settings);
    if (result.success) {
      await updateUserProfileData(user.uid, settings); // Update local AuthContext state
      toast({ title: "Success!", description: "Settings updated." });
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error });
    }
    setIsLoading(false);
  };

  if (authLoading && !user) {
      return <Card><CardHeader><CardTitle>Loading settings...</CardTitle></CardHeader><CardContent><p>Please wait.</p></CardContent></Card>
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <SlidersHorizontal className="h-7 w-7 text-primary" />
          Your Preferences
        </CardTitle>
        <CardDescription>Customize your HydrateAI experience.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-2">
            <Label htmlFor="hydrationGoal" className="text-base">Daily Hydration Goal (ml)</Label>
            <Input
              id="hydrationGoal"
              name="hydrationGoal"
              type="number"
              value={settings.hydrationGoal}
              onChange={handleChange}
              min="500"
              step="100"
              className="text-lg h-12"
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground">
              Recommended: 2000-3000ml. Adjust based on your activity level and needs.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber" className="text-base">Phone Number (for SMS reminders)</Label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              value={settings.phoneNumber}
              onChange={handleChange}
              placeholder="e.g., +12345678900"
              className="text-lg h-12"
              disabled={isLoading}
            />
             <p className="text-sm text-muted-foreground">
              Optional. Used for sending SMS reminders if enabled.
            </p>
          </div>

          <div className="space-y-4">
            <Label className="text-base block mb-2">SMS Reminder Times</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(Object.keys(settings.reminderTimes) as Array<keyof UserSettings['reminderTimes']>).map((time) => (
                <div key={time} className="flex items-center space-x-3 p-4 bg-secondary/50 rounded-lg">
                  <Checkbox
                    id={`reminder-${time}`}
                    checked={settings.reminderTimes[time]}
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
