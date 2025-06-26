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
      {/* FCM Push Notifications */}
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

          {permissionStatus !== 'granted' && !fcmEnabled && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Enable push notifications to unlock:</strong>
              </p>
              <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                <li>• 6 granular notification types (sip, glass, walk, drink, herbal tea, milestones)</li>
                <li>• Custom reminder intervals (5-480 minutes)</li>
                <li>• Day-splitting targets with confetti celebrations</li>
                <li>• 8 AI personality tones with custom vibration patterns</li>
                <li>• Smartwatch integration and device synchronization</li>
              </ul>
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

      {/* Notification Types Preview/Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Types
            {!fcmEnabled && <Badge variant="secondary">Preview</Badge>}
          </CardTitle>
          <CardDescription>
            {fcmEnabled 
              ? "Choose which types of hydration reminders you want to receive"
              : "Available notification types when push notifications are enabled"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {notificationTypes.filter(nt => nt.type !== 'milestone').map((notifType) => (
            <div key={notifType.type} className={`flex items-center justify-between p-4 border rounded-lg ${!fcmEnabled ? 'opacity-60' : ''}`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{notifType.emoji}</span>
                <div>
                  <h4 className="font-medium">{notifType.label}</h4>
                  <p className="text-sm text-muted-foreground">{notifType.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {(fcmEnabled && enabledNotificationTypes.includes(notifType.type)) && (
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
                {!fcmEnabled && (
                  <Badge variant="outline" className="text-xs">
                    {notifType.type === 'sip' ? '15min' : 
                     notifType.type === 'glass' ? '60min' :
                     notifType.type === 'walk' ? '90min' :
                     notifType.type === 'drink' ? '45min' :
                     notifType.type === 'herbal_tea' ? '120min' : '30min'}
                  </Badge>
                )}
                <Switch
                  checked={fcmEnabled && enabledNotificationTypes.includes(notifType.type)}
                  onCheckedChange={(checked) => fcmEnabled && handleNotificationTypeToggle(notifType.type, checked)}
                  disabled={!fcmEnabled}
                />
              </div>
            </div>
          ))}
          
          {!fcmEnabled && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                Enable push notifications above to customize these settings
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Day Splitting Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="text-2xl">🎯</div>
            Day Splitting Targets
            {!fcmEnabled && <Badge variant="secondary">Preview</Badge>}
          </CardTitle>
          <CardDescription>
            Break your day into hydration milestones with confetti celebrations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`flex items-center justify-between p-4 border rounded-lg ${!fcmEnabled ? 'opacity-60' : ''}`}>
            <div>
              <h4 className="font-medium">Enable Day Splitting</h4>
              <p className="text-sm text-muted-foreground">
                Get milestone alerts with confetti when you hit targets throughout the day
              </p>
            </div>
            <Switch
              checked={fcmEnabled && daySplitConfig.enabled}
              onCheckedChange={(enabled) => fcmEnabled && handleDaySplitToggle(enabled)}
              disabled={!fcmEnabled}
            />
          </div>

          {/* Always show preview of day splits */}
          <div className="space-y-4">
            <h5 className="font-medium flex items-center gap-2">
              Milestone Targets
              {!fcmEnabled && <span className="text-xs text-muted-foreground">(Preview)</span>}
            </h5>
            {(fcmEnabled ? daySplitConfig.splits : defaultDaySplits).map((split, index) => (
              <div key={index} className={`p-4 border rounded-lg space-y-3 ${!fcmEnabled ? 'opacity-60' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium">Time</label>
                    <input
                      type="time"
                      value={split.time}
                      onChange={(e) => fcmEnabled && handleSplitTargetChange(index, 'time', e.target.value)}
                      className="w-full mt-1 px-3 py-2 border rounded"
                      disabled={!fcmEnabled}
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
                      onChange={(e) => fcmEnabled && handleSplitTargetChange(index, 'targetMl', parseInt(e.target.value))}
                      className="w-full mt-1 px-3 py-2 border rounded"
                      disabled={!fcmEnabled}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium">Label</label>
                    <input
                      type="text"
                      value={split.label}
                      onChange={(e) => fcmEnabled && handleSplitTargetChange(index, 'label', e.target.value)}
                      className="w-full mt-1 px-3 py-2 border rounded"
                      placeholder="e.g., Morning Target"
                      disabled={!fcmEnabled}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={fcmEnabled && split.confettiEnabled}
                      onCheckedChange={(checked) => fcmEnabled && handleSplitTargetChange(index, 'confettiEnabled', checked)}
                      disabled={!fcmEnabled}
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
        </CardContent>
      </Card>

      {/* Tone Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            AI Notification Tone
            {!fcmEnabled && <Badge variant="secondary">Preview</Badge>}
          </CardTitle>
          <CardDescription>
            Choose the AI personality style for your hydration reminders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Motivation Style</label>
            <Select 
              value={motivationTone} 
              onValueChange={(value: MotivationTone) => setMotivationTone(value)}
              disabled={!fcmEnabled}
            >
              <SelectTrigger className={!fcmEnabled ? 'opacity-60' : ''}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableTones.map((tone) => (
                  <SelectItem key={tone.value} value={tone.value}>
                    <div className="flex items-center gap-2">
                      <span>{toneDescriptions[tone.value].emoji}</span>
                      <span>{tone.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Always show tone preview */}
          <div className={`p-4 border rounded-lg ${!fcmEnabled ? 'opacity-60' : ''}`}>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{toneDescriptions[motivationTone].emoji}</span>
                <span className="font-medium">
                  {availableTones.find(t => t.value === motivationTone)?.label}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {toneDescriptions[motivationTone].description}
              </p>
              <div className="text-sm italic text-blue-600 bg-blue-50 p-2 rounded">
                {toneDescriptions[motivationTone].example}
              </div>
            </div>
          </div>

          {!fcmEnabled && (
            <div className="text-center py-2">
              <p className="text-sm text-muted-foreground">
                Enable push notifications to activate AI tone customization
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Device Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Vibrate className="h-5 w-5" />
            Device Features
            {!fcmEnabled && <Badge variant="secondary">Preview</Badge>}
          </CardTitle>
          <CardDescription>
            Enhance notifications with vibration and smartwatch support
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`flex items-center justify-between p-3 border rounded-lg ${!fcmEnabled ? 'opacity-60' : ''}`}>
            <div className="flex items-center gap-3">
              <Vibrate className="h-5 w-5" />
              <div>
                <p className="font-medium">Vibration Patterns</p>
                <p className="text-sm text-muted-foreground">Custom vibration for each tone</p>
              </div>
            </div>
            <Switch
              checked={fcmEnabled && vibrationEnabled}
              onCheckedChange={setVibrationEnabled}
              disabled={!fcmEnabled}
            />
          </div>

          <div className={`flex items-center justify-between p-3 border rounded-lg ${!fcmEnabled ? 'opacity-60' : ''}`}>
            <div className="flex items-center gap-3">
              <Watch className="h-5 w-5" />
              <div>
                <p className="font-medium">Smartwatch Integration</p>
                <p className="text-sm text-muted-foreground">Forward notifications to wearables</p>
              </div>
            </div>
            <Switch
              checked={fcmEnabled && smartwatchEnabled}
              onCheckedChange={setSmartWatchEnabled}
              disabled={!fcmEnabled}
            />
          </div>

          {!fcmEnabled && (
            <div className="text-center py-2">
              <p className="text-sm text-muted-foreground">
                Enable push notifications to access device features
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 