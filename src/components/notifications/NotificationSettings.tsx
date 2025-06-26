'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Bell, Check, Vibrate, Clock, Target, Settings2 } from 'lucide-react';
import { fcmService, initializeFCM, testFCMNotification } from '@/lib/fcm';
import { useAuth } from '@/hooks/useAuth';
import { 
  MotivationTone, 
  NotificationFrequency, 
  NotificationType,
  notificationTypes,
  DaySplitConfig,
  DaySplitTarget,
  defaultDaySplits,
  UserPreferences
} from '@/lib/types';
import { doc, setDoc, getFirestore } from 'firebase/firestore';
import { app } from '@/lib/firebase';

interface NotificationSettingsProps {
  initialSettings?: {
    fcmEnabled?: boolean;
    vibrationEnabled?: boolean;
    smartwatchEnabled?: boolean;
    motivationTone?: MotivationTone;
    notificationFrequency?: NotificationFrequency;
    enabledNotificationTypes?: NotificationType[];
    customNotificationIntervals?: Record<NotificationType, number>;
    daySplitConfig?: DaySplitConfig;
    fcmToken?: string;
  };
  onSettingsChange?: (settings: any) => void;
}

export function NotificationSettings({ initialSettings, onSettingsChange }: NotificationSettingsProps) {
  const { user } = useAuth();
  
  // Core state
  const [fcmEnabled, setFcmEnabled] = useState(initialSettings?.fcmEnabled || false);
  const [vibrationEnabled, setVibrationEnabled] = useState(initialSettings?.vibrationEnabled !== false);
  const [smartwatchEnabled, setSmartWatchEnabled] = useState(initialSettings?.smartwatchEnabled !== false);
  const [motivationTone, setMotivationTone] = useState<MotivationTone>(initialSettings?.motivationTone ?? 'kind');
  const [notificationFrequency, setNotificationFrequency] = useState<NotificationFrequency>(initialSettings?.notificationFrequency ?? 'moderate');
  const [fcmToken, setFcmToken] = useState<string | null>(initialSettings?.fcmToken || null);
  
  // Granular notification settings
  const [enabledNotificationTypes, setEnabledNotificationTypes] = useState<NotificationType[]>(
    initialSettings?.enabledNotificationTypes || ['glass', 'drink', 'milestone']
  );
  const [customIntervals, setCustomIntervals] = useState<Record<NotificationType, number>>(
    initialSettings?.customNotificationIntervals || {} as Record<NotificationType, number>
  );
  
  // Day-splitting configuration
  const [daySplitConfig, setDaySplitConfig] = useState<DaySplitConfig>(
    initialSettings?.daySplitConfig || {
      enabled: true,
      splits: defaultDaySplits
    }
  );
  
  // UI state
  const [isInitializing, setIsInitializing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [vapidKeyMissing, setVapidKeyMissing] = useState(false);
  const [lastTestTime, setLastTestTime] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Tone definitions with live preview
  const tones: Record<MotivationTone, { label: string; emoji: string; preview: string }> = {
    funny: {
      label: 'Funny',
      emoji: '😂',
      preview: 'Your water bottle is feeling lonely... maybe give it a visit? 😂'
    },
    kind: {
      label: 'Kind',
      emoji: '😊',
      preview: 'A gentle reminder to stay hydrated, you\'re doing great! 😊'
    },
    motivational: {
      label: 'Motivational',
      emoji: '💪',
      preview: 'You\'ve got this! Every sip brings you closer to your goal! 💪'
    },
    sarcastic: {
      label: 'Sarcastic',
      emoji: '🙄',
      preview: 'Oh look, your water goal is still waiting... how surprising 🙄'
    },
    strict: {
      label: 'Strict',
      emoji: '🧐',
      preview: 'Drink water. Now. Your body needs it. No excuses. 🧐'
    },
    supportive: {
      label: 'Supportive',
      emoji: '🤗',
      preview: 'Hey, just checking in - how about some water to keep you feeling amazing? 🤗'
    },
    crass: {
      label: 'Crass',
      emoji: '💥',
      preview: 'Seriously mate, your hydration game is weaker than decaf coffee! 💥'
    },
    weightloss: {
      label: 'Weight Loss',
      emoji: '🏋️‍♀️',
      preview: 'Water boosts metabolism and burns calories - drink up for those weight goals! 🏋️‍♀️'
    }
  };

  // Frequency definitions
  const frequencies: Record<NotificationFrequency, { label: string; description: string }> = {
    minimal: { label: 'Minimal', description: 'You\'ll receive ~2 reminders per day' },
    moderate: { label: 'Moderate', description: 'You\'ll receive ~4 reminders per day' },
    frequent: { label: 'Frequent', description: 'You\'ll receive ~8 reminders per day' }
  };

  useEffect(() => {
    // Check current notification permission status
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const autoSave = async () => {
    if (!user) return;

    setSaveStatus('saving');
    
    try {
      const db = getFirestore(app);
      const userPrefsRef = doc(db, 'user_preferences', user.uid);
      
      const settings = {
        fcmEnabled,
        vibrationEnabled,
        smartwatchEnabled,
        motivationTone,
        notificationFrequency,
        enabledNotificationTypes,
        customNotificationIntervals: customIntervals,
        daySplitConfig,
        fcmToken,
        updatedAt: new Date()
      };

      await setDoc(userPrefsRef, settings, { merge: true });
      
      if (onSettingsChange) {
        onSettingsChange(settings);
      }

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error saving notification settings:', error);
      setSaveStatus('idle');
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'Could not save notification settings'
      });
    }
  };

  // Auto-save when settings change
  useEffect(() => {
    if (user && saveStatus === 'idle') {
      autoSave();
    }
  }, [fcmEnabled, vibrationEnabled, smartwatchEnabled, motivationTone, notificationFrequency, enabledNotificationTypes, customIntervals, daySplitConfig]);

  const handleMasterToggle = async (enabled: boolean) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Required',
        description: 'Please log in to manage notifications'
      });
      return;
    }

    setIsInitializing(true);
    setVapidKeyMissing(false);
    
    try {
      if (enabled) {
        // Check if VAPID key is available
        const configResponse = await fetch('/api/firebase-config');
        const config = await configResponse.json();
        
        if (!config.vapidKey) {
          setVapidKeyMissing(true);
          throw new Error('VAPID key not configured');
        }

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
          description: 'You can re-enable them anytime'
        });
      }
    } catch (error) {
      console.error('FCM toggle error:', error);
      
      if (error instanceof Error && error.message === 'VAPID key not configured') {
        toast({
          variant: 'destructive',
          title: 'Setup Required',
          description: 'Push notifications need to be configured. See instructions below.'
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Setup Failed',
          description: 'Please check browser permissions and try again'
        });
      }
    } finally {
      setIsInitializing(false);
    }
  };

  const handleGrantPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    
    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      
      if (permission === 'granted') {
        toast({
          title: 'Permission Granted! ✅',
          description: 'You can now receive push notifications'
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Permission Failed',
        description: 'Could not grant notification permission'
      });
    }
  };

  const handleTestNotification = async () => {
    if (!user || !fcmEnabled) return;

    setIsTesting(true);
    
    try {
      const result = await testFCMNotification(user.uid, motivationTone);
      
      if (result.success) {
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setLastTestTime(now);
        
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

  const toggleNotificationType = (type: NotificationType) => {
    const newTypes = enabledNotificationTypes.includes(type)
      ? enabledNotificationTypes.filter(t => t !== type)
      : [...enabledNotificationTypes, type];
    setEnabledNotificationTypes(newTypes);
  };

  const updateCustomInterval = (type: NotificationType, minutes: number) => {
    setCustomIntervals(prev => ({
      ...prev,
      [type]: minutes
    }));
  };

  const getIntervalForType = (type: NotificationType): number => {
    if (customIntervals[type]) return customIntervals[type];
    const config = notificationTypes.find(nt => nt.type === type);
    return config?.defaultInterval || 60;
  };

  const updateDaySplit = (index: number, field: keyof DaySplitTarget, value: any) => {
    const newSplits = [...daySplitConfig.splits];
    newSplits[index] = { ...newSplits[index], [field]: value };
    setDaySplitConfig(prev => ({ ...prev, splits: newSplits }));
  };

  return (
    <div className="space-y-6">
      {/* 1. Master Switch */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Push Notifications
            {saveStatus === 'saved' && (
              <Badge variant="outline" className="text-green-600 ml-auto">
                <Check className="h-3 w-3 mr-1" />
                Saved
              </Badge>
            )}
            {saveStatus === 'saving' && (
              <Badge variant="outline" className="text-blue-600 ml-auto">
                Saving...
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Enable or disable all hydration reminders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Enable Push Notifications</p>
              <p className="text-sm text-muted-foreground">
                Receive AI-powered hydration reminders directly to your device
              </p>
            </div>
            <Switch
              checked={fcmEnabled}
              onCheckedChange={handleMasterToggle}
              disabled={isInitializing}
            />
          </div>

          {isInitializing && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Setting up push notifications...</strong>
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Please allow notifications when prompted by your browser.
              </p>
            </div>
          )}

          {vapidKeyMissing && (
            <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800 font-semibold mb-2">
                🔧 Push Notifications Setup Required
              </p>
              <p className="text-sm text-orange-700 mb-3">
                To enable push notifications, you need to configure a VAPID key in your environment variables.
              </p>
              <div className="bg-orange-100 p-3 rounded text-xs font-mono text-orange-800 mb-3">
                <p className="font-semibold mb-1">Add to Vercel Environment Variables:</p>
                <p>NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Device Settings - Only show if master is enabled */}
      {fcmEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Vibrate className="h-5 w-5" />
              Device Settings
            </CardTitle>
            <CardDescription>
              Configure device-specific notification features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">Device Vibration</p>
                <p className="text-sm text-muted-foreground">
                  Custom vibration patterns for each notification tone
                </p>
              </div>
              <Switch
                checked={vibrationEnabled}
                onCheckedChange={setVibrationEnabled}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">Smartwatch Sync</p>
                <p className="text-sm text-muted-foreground">
                  Forward notifications to connected smartwatch
                </p>
              </div>
              <Switch
                checked={smartwatchEnabled}
                onCheckedChange={setSmartWatchEnabled}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3. Notification Types - Only show if master is enabled */}
      {fcmEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Notification Types
            </CardTitle>
            <CardDescription>
              Choose which types of reminders you want to receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {notificationTypes.map((type) => (
              <div key={type.type} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{type.emoji}</span>
                    <div>
                      <p className="font-medium">{type.label}</p>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={enabledNotificationTypes.includes(type.type)}
                    onCheckedChange={() => toggleNotificationType(type.type)}
                  />
                </div>
                
                {enabledNotificationTypes.includes(type.type) && type.type !== 'milestone' && (
                  <div className="ml-11 space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm">Interval: {getIntervalForType(type.type)} minutes</Label>
                    </div>
                    <Slider
                      value={[getIntervalForType(type.type)]}
                      onValueChange={([value]) => updateCustomInterval(type.type, value)}
                      min={5}
                      max={480}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>5 min</span>
                      <span>8 hours</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 4. Day-Splitting Configuration - Only show if master is enabled and milestone is enabled */}
      {fcmEnabled && enabledNotificationTypes.includes('milestone') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Day-Splitting Targets
            </CardTitle>
            <CardDescription>
              Break your day into thirds with confetti celebrations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">Enable Day-Splitting</p>
                <p className="text-sm text-muted-foreground">
                  Get milestone alerts at 10am (1L), 3pm (2L), and 8pm (3L)
                </p>
              </div>
              <Switch
                checked={daySplitConfig.enabled}
                onCheckedChange={(enabled) => setDaySplitConfig(prev => ({ ...prev, enabled }))}
              />
            </div>

            {daySplitConfig.enabled && (
              <div className="space-y-3">
                {daySplitConfig.splits.map((split, index) => (
                  <div key={index} className="grid grid-cols-3 gap-3 items-center p-3 border rounded-lg">
                    <div>
                      <Label className="text-sm">Time</Label>
                      <Input
                        type="time"
                        value={split.time}
                        onChange={(e) => updateDaySplit(index, 'time', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Target (ml)</Label>
                      <Input
                        type="number"
                        value={split.targetMl}
                        onChange={(e) => updateDaySplit(index, 'targetMl', parseInt(e.target.value) || 0)}
                        className="mt-1"
                        min="0"
                        step="100"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={split.confettiEnabled}
                        onCheckedChange={(enabled) => updateDaySplit(index, 'confettiEnabled', enabled)}
                      />
                      <Label className="text-sm">🎉 Confetti</Label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 5. AI Personality Tone - Only show if master is enabled */}
      {fcmEnabled && (
        <Card>
          <CardHeader>
            <CardTitle>AI Personality Tone</CardTitle>
            <CardDescription>
              Choose how your hydration coach talks to you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(tones) as MotivationTone[]).map((tone) => (
                <button
                  key={tone}
                  onClick={() => setMotivationTone(tone)}
                  className={`p-3 rounded-lg border text-left transition-colors group ${
                    motivationTone === tone
                      ? 'bg-blue-50 border-blue-200 text-blue-800'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                  title={tones[tone].preview}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{tones[tone].emoji}</span>
                    <span className="font-medium">{tones[tone].label}</span>
                  </div>
                </button>
              ))}
            </div>
            
            {/* Live Preview */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-1">Preview:</p>
              <p className="text-sm text-gray-600 italic">
                "{tones[motivationTone].preview}"
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 6. Permission & Test - Only show if master is enabled */}
      {fcmEnabled && (
        <Card>
          <CardHeader>
            <CardTitle>Permission & Test</CardTitle>
            <CardDescription>
              Grant browser permissions and test your notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {permissionStatus !== 'granted' ? (
              <Button onClick={handleGrantPermission} className="w-full">
                Grant Notification Permission
              </Button>
            ) : (
              <Button 
                onClick={handleTestNotification} 
                disabled={isTesting}
                className="w-full"
              >
                {isTesting ? 'Sending Test...' : 'Send Test Notification'}
              </Button>
            )}
            
            {lastTestTime && (
              <p className="text-sm text-muted-foreground text-center">
                Last test sent at {lastTestTime}
              </p>
            )}
            
            {permissionStatus === 'denied' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  <strong>Notifications are blocked</strong>
                </p>
                <p className="text-sm text-red-700 mt-1">
                  To enable: Click the lock icon in your browser's address bar → Allow notifications → Refresh this page.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 