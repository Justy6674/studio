'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Bell, Check } from 'lucide-react';
import { fcmService, initializeFCM, testFCMNotification } from '@/lib/fcm';
import { useAuth } from '@/hooks/useAuth';
import { MotivationTone, NotificationFrequency } from '@/lib/types';
import { doc, setDoc, getFirestore } from 'firebase/firestore';
import { app } from '@/lib/firebase';

interface NotificationSettingsProps {
  initialSettings?: {
    fcmEnabled?: boolean;
    motivationTone?: MotivationTone;
    notificationFrequency?: NotificationFrequency;
    fcmToken?: string;
  };
  onSettingsChange?: (settings: any) => void;
}

export function NotificationSettings({ initialSettings, onSettingsChange }: NotificationSettingsProps) {
  const { user } = useAuth();
  
  // Core state
  const [fcmEnabled, setFcmEnabled] = useState(initialSettings?.fcmEnabled || false);
  const [motivationTone, setMotivationTone] = useState<MotivationTone>(initialSettings?.motivationTone ?? 'kind');
  const [notificationFrequency, setNotificationFrequency] = useState<NotificationFrequency>(initialSettings?.notificationFrequency ?? 'moderate');
  const [fcmToken, setFcmToken] = useState<string | null>(initialSettings?.fcmToken || null);
  
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
        motivationTone,
        notificationFrequency,
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
    }
  };

  // Auto-save when settings change
  useEffect(() => {
    if (user && saveStatus === 'idle') {
      autoSave();
    }
  }, [fcmEnabled, motivationTone, notificationFrequency]);

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
              <div className="text-sm text-orange-700 space-y-1">
                <p><strong>How to get your VAPID key:</strong></p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Go to <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="underline">Firebase Console</a></li>
                  <li>Select your project → Project Settings</li>
                  <li>Go to Cloud Messaging tab</li>
                  <li>In "Web configuration" section, click "Generate key pair"</li>
                  <li>Copy the key and add it to Vercel environment variables</li>
                  <li>Redeploy your app</li>
                </ol>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Frequency - Only show if master is enabled */}
      {fcmEnabled && (
        <Card>
          <CardHeader>
            <CardTitle>Frequency</CardTitle>
            <CardDescription>
              How often you want to receive reminders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(frequencies) as NotificationFrequency[]).map((freq) => (
                <button
                  key={freq}
                  onClick={() => setNotificationFrequency(freq)}
                  className={`p-3 rounded-lg border text-center transition-colors ${
                    notificationFrequency === freq
                      ? 'bg-blue-50 border-blue-200 text-blue-800'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="font-medium">{frequencies[freq].label}</div>
                </button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              {frequencies[notificationFrequency].description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* 3. Tone Selection - Only show if master is enabled */}
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

      {/* 4. Permission & Test - Only show if master is enabled */}
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