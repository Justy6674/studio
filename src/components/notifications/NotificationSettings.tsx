'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Bell, Check, Vibrate, Clock, MessageSquare, AlertCircle } from 'lucide-react';
import { fcmService, initializeFCM, testFCMNotification } from '@/lib/fcm';
import { useAuth } from '@/hooks/useAuth';
import { MotivationTone, NotificationFrequency } from '@/lib/types';
import { doc, setDoc, getFirestore } from 'firebase/firestore';
import { app } from '@/lib/firebase';

interface NotificationSettingsProps {
  initialSettings?: {
    fcmEnabled?: boolean;
    vibrationEnabled?: boolean;
    vibrationIntensity?: 'light' | 'medium' | 'heavy';
    motivationTone?: MotivationTone;
    notificationFrequency?: NotificationFrequency;
    timeWindows?: string[];
    smsEnabled?: boolean;
    smsMaxPerDay?: number;
    smsTone?: MotivationTone;
    fcmToken?: string;
    smartwatchEnabled?: boolean;
    enabledNotificationTypes?: any[];
    customNotificationIntervals?: Record<string, number>;
    daySplitConfig?: any;
  };
  onSettingsChange?: (settings: any) => void;
}

export function NotificationSettings({ initialSettings, onSettingsChange }: NotificationSettingsProps) {
  const { user } = useAuth();
  
  // Core state
  const [fcmEnabled, setFcmEnabled] = useState(initialSettings?.fcmEnabled || false);
  const [vibrationEnabled, setVibrationEnabled] = useState(initialSettings?.vibrationEnabled !== false);
  const [vibrationIntensity, setVibrationIntensity] = useState<'light' | 'medium' | 'heavy'>(initialSettings?.vibrationIntensity || 'medium');
  const [motivationTone, setMotivationTone] = useState<MotivationTone>(initialSettings?.motivationTone ?? 'kind');
  const [notificationFrequency, setNotificationFrequency] = useState<NotificationFrequency>(initialSettings?.notificationFrequency ?? 'moderate');
  const [timeWindows, setTimeWindows] = useState<string[]>(initialSettings?.timeWindows || ['morning', 'afternoon']);
  const [smsEnabled, setSmsEnabled] = useState(initialSettings?.smsEnabled || false);
  const [smsMaxPerDay, setSmsMaxPerDay] = useState(initialSettings?.smsMaxPerDay || 1);
  const [smsTone, setSmsTone] = useState<MotivationTone>(initialSettings?.smsTone || 'kind');
  const [fcmToken, setFcmToken] = useState<string | null>(initialSettings?.fcmToken || null);
  
  // UI state
  const [isInitializing, setIsInitializing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Tone definitions with emojis and descriptions
  const tones: Record<MotivationTone, { label: string; emoji: string; description: string }> = {
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
  const frequencies: Record<NotificationFrequency, { label: string; description: string }> = {
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

  useEffect(() => {
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
        vibrationIntensity,
        motivationTone,
        notificationFrequency,
        timeWindows,
        smsEnabled,
        smsMaxPerDay,
        smsTone,
        fcmToken,
        updatedAt: new Date()
      };

      await setDoc(userPrefsRef, settings, { merge: true });
      
      if (onSettingsChange) {
        onSettingsChange(settings);
      }

      setSaveStatus('saved');
      
      // Show success toast
      toast({
        title: 'Saved',
        description: 'Notification settings updated successfully',
        duration: 2000
      });
      
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error saving notification settings:', error);
      setSaveStatus('error');
      
      toast({
        variant: 'destructive',
        title: 'Couldn\'t save your changes',
        description: 'Tap to retry',
        action: (
          <Button variant="outline" size="sm" onClick={autoSave}>
            Retry
          </Button>
        )
      });
    }
  };

  // Auto-save when settings change
  useEffect(() => {
    if (user && saveStatus === 'idle') {
      autoSave();
    }
  }, [fcmEnabled, vibrationEnabled, vibrationIntensity, motivationTone, notificationFrequency, timeWindows, smsEnabled, smsMaxPerDay, smsTone]);

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
    
    try {
      if (enabled) {
        // Get Firebase config directly instead of API call
        const { firebaseConfig } = await import('@/lib/firebase');
        
        if (!firebaseConfig.vapidKey) {
          throw new Error('VAPID key not configured');
        }

        // Initialize FCM and get token
        const token = await initializeFCM(user.uid);
        if (token) {
          setFcmToken(token);
          setFcmEnabled(true);
          setPermissionStatus('granted');
          
          // Add haptic feedback
          if ('vibrate' in navigator) {
            navigator.vibrate([100, 50, 100]);
          }
          
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
      
      toast({
        variant: 'destructive',
        title: 'Setup Failed',
        description: 'Please check browser permissions and try again'
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const handleTestNotification = async () => {
    if (!user || !fcmToken) return;
    
    setIsTesting(true);
    
    try {
      const result = await testFCMNotification(user.uid, motivationTone);
      if (result.success) {
        toast({
          title: 'Test Sent! 🔔',
          description: 'Check your notifications'
        });
      } else {
        throw new Error(result.error || 'Test failed');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Test Failed',
        description: 'Could not send test notification'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const toggleTimeWindow = (windowId: string) => {
    setTimeWindows(prev => 
      prev.includes(windowId) 
        ? prev.filter(w => w !== windowId)
        : [...prev, windowId]
    );
  };

  return (
    <div className="space-y-6">
      {/* OBVIOUS VISUAL INDICATOR - NEW NOTIFICATION SETTINGS */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-lg text-center">
        <h2 className="text-xl font-bold">🎉 NEW iOS-STYLE NOTIFICATION SETTINGS 🎉</h2>
        <p className="text-sm mt-1">This is the comprehensive notification system you requested!</p>
      </div>

      {/* Save Status Indicator */}
      {saveStatus === 'saving' && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          Saving...
        </div>
      )}

      {/* 1. Master Switch */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Receive hydration reminders on this device
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Push Notifications</p>
              <p className="text-sm text-muted-foreground">
                {fcmEnabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
            <Switch
              checked={fcmEnabled}
              onCheckedChange={handleMasterToggle}
              disabled={isInitializing}
            />
          </div>
        </CardContent>
      </Card>

      {/* 2. Notification Tone - Only show when Push is ON */}
      {fcmEnabled && (
        <Card>
          <CardHeader>
            <CardTitle>Notification Tone</CardTitle>
            <CardDescription>
              Choose your hydration coach's personality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(tones) as MotivationTone[]).map((tone) => (
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
                    <span className="text-lg">{tones[tone].emoji}</span>
                    <span className="font-medium">{tones[tone].label}</span>
                  </div>
                  <p className="text-xs text-gray-600">{tones[tone].description}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3. Frequency & Timing - Only show when Push is ON */}
      {fcmEnabled && (
        <Card>
          <CardHeader>
            <CardTitle>Frequency & Timing</CardTitle>
            <CardDescription>
              When and how often you want reminders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Frequency Radio Group */}
            <div>
              <Label className="text-base font-medium mb-3 block">Frequency</Label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(frequencies) as NotificationFrequency[]).map((freq) => (
                  <button
                    key={freq}
                    onClick={() => setNotificationFrequency(freq)}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      notificationFrequency === freq
                        ? 'bg-blue-50 border-blue-200 text-blue-800 ring-2 ring-blue-200'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-medium">{frequencies[freq].label}</div>
                    <div className="text-xs text-gray-600 mt-1">{frequencies[freq].description}</div>
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

      {/* 4. Vibration - Only show when Push is ON */}
      {fcmEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Vibrate className="h-5 w-5" />
              Vibration
            </CardTitle>
            <CardDescription>
              Device vibration for notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">Vibrate on Reminder</p>
                <p className="text-sm text-muted-foreground">
                  {vibrationEnabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
              <Switch
                checked={vibrationEnabled}
                onCheckedChange={setVibrationEnabled}
              />
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
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 5. SMS Reminders - Only show when Push is ON */}
      {fcmEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              SMS Reminders
            </CardTitle>
            <CardDescription>
              Text message backup reminders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">SMS Reminders</p>
                <p className="text-sm text-muted-foreground">
                  {smsEnabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
              <Switch
                checked={smsEnabled}
                onCheckedChange={setSmsEnabled}
              />
            </div>

            {smsEnabled && (
              <div className="space-y-4">
                {/* Max per day stepper */}
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

                {/* SMS Tone */}
                <div>
                  <Label className="text-base font-medium mb-3 block">SMS Tone</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(tones) as MotivationTone[]).map((tone) => (
                      <button
                        key={tone}
                        onClick={() => setSmsTone(tone)}
                        className={`p-2 rounded-lg border text-left transition-all ${
                          smsTone === tone
                            ? 'bg-blue-50 border-blue-200 text-blue-800 ring-2 ring-blue-200'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{tones[tone].emoji}</span>
                          <span className="text-sm font-medium">{tones[tone].label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 6. Test Notifications - Only show when Push is ON */}
      {fcmEnabled && (
        <Card>
          <CardHeader>
            <CardTitle>Test Notifications</CardTitle>
            <CardDescription>
              Send a test notification to verify everything works
            </CardDescription>
          </CardHeader>
          <CardContent>
            {permissionStatus !== 'granted' ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span className="text-sm text-amber-800">
                    Browser permission required for notifications
                  </span>
                </div>
                <Button 
                  onClick={() => Notification.requestPermission().then(setPermissionStatus)}
                  className="w-full"
                >
                  Grant Permission
                </Button>
              </div>
            ) : (
              <Button 
                onClick={handleTestNotification} 
                disabled={isTesting}
                className="w-full"
              >
                {isTesting ? 'Sending Test...' : `Send Test (${tones[motivationTone].emoji} ${tones[motivationTone].label})`}
              </Button>
            )}
            
            {permissionStatus === 'denied' && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 font-medium">Notifications are blocked</p>
                <p className="text-sm text-red-700 mt-1">
                  Click the lock icon in your browser's address bar → Allow notifications → Refresh this page.
                </p>
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
  );
} 