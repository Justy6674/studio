'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { Bell, Smartphone, Watch, Vibrate, Volume2, TestTube2 } from 'lucide-react';
import { fcmService, initializeFCM, testFCMNotification } from '@/lib/fcm';
import { useAuth } from '@/hooks/useAuth';
import { availableTones, notificationFrequencies, MotivationTone, NotificationFrequency, notificationTypes, NotificationTypeConfig, NotificationType, DaySplitConfig, defaultDaySplits, DaySplitTarget } from '@/lib/types';
import { doc, updateDoc, getFirestore } from 'firebase/firestore';
import { app } from '@/lib/firebase';

interface NotificationSettingsProps {
  initialSettings?: {
    fcmEnabled?: boolean;
    motivationTone?: MotivationTone;
    notificationFrequency?: NotificationFrequency;
    vibrationEnabled?: boolean;
    smartwatchEnabled?: boolean;
    fcmToken?: string;
    enabledNotificationTypes?: NotificationType[];
    customNotificationIntervals?: Record<NotificationType, number>;
    daySplitConfig?: DaySplitConfig;
  };
  onSettingsChange?: (settings: any) => void;
}

export function NotificationSettings({ initialSettings, onSettingsChange }: NotificationSettingsProps) {
  const { user } = useAuth();
  const [fcmEnabled, setFcmEnabled] = useState(initialSettings?.fcmEnabled ?? false);
  const [motivationTone, setMotivationTone] = useState<MotivationTone>(initialSettings?.motivationTone ?? 'kind');
  const [notificationFrequency, setNotificationFrequency] = useState<NotificationFrequency>(initialSettings?.notificationFrequency ?? 'moderate');
  const [vibrationEnabled, setVibrationEnabled] = useState(initialSettings?.vibrationEnabled ?? true);
  const [smartwatchEnabled, setSmartWatchEnabled] = useState(initialSettings?.smartwatchEnabled ?? false);
  const [fcmToken, setFcmToken] = useState(initialSettings?.fcmToken ?? null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  
  // New state for enhanced notifications
  const [enabledNotificationTypes, setEnabledNotificationTypes] = useState<NotificationType[]>(
    initialSettings?.enabledNotificationTypes ?? ['drink', 'glass']
  );
  const [customIntervals, setCustomIntervals] = useState<Record<NotificationType, number>>(
    initialSettings?.customNotificationIntervals ?? {
      sip: 15,
      glass: 60,
      walk: 90,
      drink: 45,
      herbal_tea: 120,
      milestone: 0
    }
  );
  const [daySplitConfig, setDaySplitConfig] = useState<DaySplitConfig>(
    initialSettings?.daySplitConfig ?? {
      enabled: false,
      splits: defaultDaySplits
    }
  );

  useEffect(() => {
    // Check current notification permission status
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const toneDescriptions: Record<MotivationTone, { description: string; example: string; emoji: string }> = {
    funny: {
      description: 'Lighthearted and humorous',
      example: '"Your water bottle is feeling lonely... maybe give it a visit? 😂"',
      emoji: '😂'
    },
    kind: {
      description: 'Gentle and encouraging',
      example: '"A gentle reminder to stay hydrated, you\'re doing great! 😊"',
      emoji: '😊'
    },
    motivational: {
      description: 'Energetic and inspiring',
      example: '"You\'ve got this! Every sip brings you closer to your goal! 💪"',
      emoji: '💪'
    },
    sarcastic: {
      description: 'Witty with a playful edge',
      example: '"Oh look, your water goal is still waiting... how surprising 🙄"',
      emoji: '🙄'
    },
    strict: {
      description: 'Direct and authoritative',
      example: '"Drink water. Now. Your body needs it. No excuses. 🧐"',
      emoji: '🧐'
    },
    supportive: {
      description: 'Caring and understanding',
      example: '"Hey, just checking in - how about some water to keep you feeling amazing? 🤗"',
      emoji: '🤗'
    },
    crass: {
      description: 'Bold and unfiltered',
      example: '"Seriously mate, your hydration game is weaker than decaf coffee! 💥"',
      emoji: '💥'
    },
    weightloss: {
      description: 'Focused on weight management',
      example: '"Water boosts metabolism and burns calories - drink up for those weight goals! 🏋️‍♀️"',
      emoji: '🏋️‍♀️'
    }
  };

  const frequencyDescriptions: Record<NotificationFrequency, { description: string; interval: string }> = {
    minimal: {
      description: 'Essential reminders only',
      interval: '2-3 times per day'
    },
    moderate: {
      description: 'Balanced motivation',
      interval: '4-6 times per day'
    },
    frequent: {
      description: 'Regular encouragement',
      interval: '8-12 times per day'
    }
  };

  const handleFCMToggle = async (enabled: boolean) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Required',
        description: 'Please log in to manage notifications'
      });
      return;
    }

    setIsInitializing(true);
    
    try {
      if (enabled) {
        // Initialize FCM and get token
        const token = await initializeFCM(user.uid);
        if (token) {
          setFcmToken(token);
          setFcmEnabled(true);
          setPermissionStatus('granted');
          
          toast({
            title: 'Push Notifications Enabled! 🔔',
            description: 'You\'ll now receive motivational hydration reminders'
          });
        } else {
          throw new Error('Failed to get FCM token');
        }
      } else {
        setFcmEnabled(false);
        setFcmToken(null);
        
        toast({
          title: 'Push Notifications Disabled',
          description: 'You can re-enable them anytime in settings'
        });
      }

      await saveSettings();
    } catch (error) {
      console.error('FCM toggle error:', error);
      toast({
        variant: 'destructive',
        title: 'Notification Setup Failed',
        description: 'Please check browser permissions and try again'
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const saveSettings = async () => {
    if (!user) return;

    try {
      const db = getFirestore(app);
      const userPrefsRef = doc(db, 'user_preferences', user.uid);
      
      const settings = {
        fcmEnabled,
        motivationTone,
        notificationFrequency,
        vibrationEnabled,
        smartwatchEnabled,
        fcmToken,
        enabledNotificationTypes,
        customNotificationIntervals: customIntervals,
        daySplitConfig,
        updatedAt: new Date()
      };

      await updateDoc(userPrefsRef, settings);
      
      if (onSettingsChange) {
        onSettingsChange(settings);
      }

      console.log('Notification settings saved successfully');
    } catch (error) {
      console.error('Error saving notification settings:', error);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'Could not save notification settings'
      });
    }
  };

  const handleTestNotification = async () => {
    if (!user || !fcmEnabled) {
      toast({
        variant: 'destructive',
        title: 'Cannot Test',
        description: 'Please enable notifications first'
      });
      return;
    }

    setIsTesting(true);
    
    try {
      const result = await testFCMNotification(user.uid, motivationTone);
      
      if (result.success) {
        toast({
          title: 'Test Notification Sent! 🎉',
          description: 'Check your device for the notification'
        });
      } else {
        throw new Error(result.error || 'Test failed');
      }
    } catch (error) {
      console.error('Test notification error:', error);
      toast({
        variant: 'destructive',
        title: 'Test Failed',
        description: 'Could not send test notification'
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Auto-save when settings change
  useEffect(() => {
    if (user) {
      saveSettings();
    }
  }, [motivationTone, notificationFrequency, vibrationEnabled, smartwatchEnabled, enabledNotificationTypes, customIntervals, daySplitConfig]);

  const handleNotificationTypeToggle = (type: NotificationType, enabled: boolean) => {
    if (enabled) {
      setEnabledNotificationTypes(prev => [...prev, type]);
    } else {
      setEnabledNotificationTypes(prev => prev.filter(t => t !== type));
    }
  };

  const handleIntervalChange = (type: NotificationType, interval: number) => {
    setCustomIntervals(prev => ({
      ...prev,
      [type]: interval
    }));
  };

  const handleDaySplitToggle = (enabled: boolean) => {
    setDaySplitConfig(prev => ({
      ...prev,
      enabled
    }));
  };

  const handleSplitTargetChange = (index: number, field: keyof DaySplitTarget, value: any) => {
    setDaySplitConfig(prev => ({
      ...prev,
      splits: prev.splits.map((split, i) => 
        i === index ? { ...split, [field]: value } : split
      )
    }));
  };

  return (
    <div className="space-y-6">
      {/* Main FCM Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Get AI-powered hydration reminders sent directly to your device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Enable Push Notifications</p>
              <p className="text-sm text-muted-foreground">
                Receive reminders even when the app is closed
              </p>
            </div>
            <Switch
              checked={fcmEnabled}
              onCheckedChange={handleFCMToggle}
              disabled={isInitializing}
            />
          </div>

          {permissionStatus !== 'granted' && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Browser notifications are {permissionStatus}. Enable push notifications to receive reminders.
              </p>
            </div>
          )}

          {fcmToken && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-green-600">
                <Smartphone className="h-3 w-3 mr-1" />
                Connected
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestNotification}
                disabled={isTesting || !fcmEnabled}
                className="ml-auto"
              >
                <TestTube2 className="h-4 w-4 mr-1" />
                {isTesting ? 'Testing...' : 'Test Notification'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Types Selection */}
      {fcmEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Types
            </CardTitle>
            <CardDescription>
              Choose which types of hydration reminders you want to receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {notificationTypes.filter(nt => nt.type !== 'milestone').map((notifType) => (
              <div key={notifType.type} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{notifType.emoji}</span>
                  <div>
                    <h4 className="font-medium">{notifType.label}</h4>
                    <p className="text-sm text-muted-foreground">{notifType.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {enabledNotificationTypes.includes(notifType.type) && (
                    <div className="flex items-center gap-2">
                      <label className="text-sm">Every</label>
                      <input
                        type="number"
                        min="5"
                        max="480"
                        value={customIntervals[notifType.type]}
                        onChange={(e) => handleIntervalChange(notifType.type, parseInt(e.target.value))}
                        className="w-16 px-2 py-1 text-sm border rounded"
                      />
                      <span className="text-sm text-muted-foreground">min</span>
                    </div>
                  )}
                  <Switch
                    checked={enabledNotificationTypes.includes(notifType.type)}
                    onCheckedChange={(checked) => handleNotificationTypeToggle(notifType.type, checked)}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Day Splitting Configuration */}
      {fcmEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="text-2xl">🎯</div>
              Day Splitting Targets
            </CardTitle>
            <CardDescription>
              Break your day into hydration milestones with confetti celebrations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Enable Day Splitting</h4>
                <p className="text-sm text-muted-foreground">
                  Get milestone alerts with confetti when you hit targets throughout the day
                </p>
              </div>
              <Switch
                checked={daySplitConfig.enabled}
                onCheckedChange={handleDaySplitToggle}
              />
            </div>

            {daySplitConfig.enabled && (
              <div className="space-y-4">
                <h5 className="font-medium">Milestone Targets</h5>
                {daySplitConfig.splits.map((split, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="text-sm font-medium">Time</label>
                        <input
                          type="time"
                          value={split.time}
                          onChange={(e) => handleSplitTargetChange(index, 'time', e.target.value)}
                          className="w-full mt-1 px-3 py-2 border rounded"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-sm font-medium">Target (ml)</label>
                        <input
                          type="number"
                          min="250"
                          max="5000"
                          step="250"
                          value={split.targetMl}
                          onChange={(e) => handleSplitTargetChange(index, 'targetMl', parseInt(e.target.value))}
                          className="w-full mt-1 px-3 py-2 border rounded"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="text-sm font-medium">Label</label>
                        <input
                          type="text"
                          value={split.label}
                          onChange={(e) => handleSplitTargetChange(index, 'label', e.target.value)}
                          className="w-full mt-1 px-3 py-2 border rounded"
                          placeholder="e.g., Morning Target"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={split.confettiEnabled}
                          onCheckedChange={(checked) => handleSplitTargetChange(index, 'confettiEnabled', checked)}
                        />
                        <label className="text-sm">Confetti</label>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="text-sm text-muted-foreground p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <strong>Example:</strong> Set 10:00 AM for 1L, 3:00 PM for 2L, and 8:00 PM for 3L to break your day into thirds with celebration confetti!
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tone Selection */}
      {fcmEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              Notification Tone
            </CardTitle>
            <CardDescription>
              Choose the AI personality style for your hydration reminders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Motivation Style</label>
              <Select value={motivationTone} onValueChange={(value: MotivationTone) => setMotivationTone(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableTones.map((tone) => (
                    <SelectItem key={tone} value={tone}>
                      <div className="flex items-center gap-2">
                        <span>{toneDescriptions[tone].emoji}</span>
                        <span className="capitalize">{tone}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {motivationTone && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-1">
                  {toneDescriptions[motivationTone].description}
                </p>
                <p className="text-sm text-blue-700 italic">
                  Example: {toneDescriptions[motivationTone].example}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Frequency Settings */}
      {fcmEnabled && (
        <Card>
          <CardHeader>
            <CardTitle>Notification Frequency</CardTitle>
            <CardDescription>
              Control how often you receive hydration reminders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Reminder Frequency</label>
              <Select value={notificationFrequency} onValueChange={(value: NotificationFrequency) => setNotificationFrequency(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {notificationFrequencies.map((frequency) => (
                    <SelectItem key={frequency} value={frequency}>
                      <div className="flex flex-col">
                        <span className="capitalize">{frequency}</span>
                        <span className="text-xs text-muted-foreground">
                          {frequencyDescriptions[frequency].interval}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {notificationFrequency && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Frequency:</strong> {frequencyDescriptions[notificationFrequency].description}
                  <br />
                  <strong>Schedule:</strong> {frequencyDescriptions[notificationFrequency].interval}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Device Settings */}
      {fcmEnabled && (
        <Card>
          <CardHeader>
            <CardTitle>Device Settings</CardTitle>
            <CardDescription>
              Configure device-specific notification features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Vibrate className="h-4 w-4" />
                <div className="space-y-1">
                  <p className="font-medium">Vibration</p>
                  <p className="text-sm text-muted-foreground">
                    Vibrate device when notification arrives
                  </p>
                </div>
              </div>
              <Switch
                checked={vibrationEnabled}
                onCheckedChange={setVibrationEnabled}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Watch className="h-4 w-4" />
                <div className="space-y-1">
                  <p className="font-medium">Smartwatch Support</p>
                  <p className="text-sm text-muted-foreground">
                    Send notifications to Apple Watch / WearOS
                  </p>
                </div>
              </div>
              <Switch
                checked={smartwatchEnabled}
                onCheckedChange={setSmartWatchEnabled}
              />
            </div>

            {smartwatchEnabled && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm text-purple-800">
                  <strong>Smartwatch enabled:</strong> Notifications will be delivered to your paired Apple Watch or WearOS device with haptic feedback.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 