'use client';

import { getMessaging, getToken, onMessage, MessagePayload } from 'firebase/messaging';
import { app } from '@/lib/firebase';
import { doc, setDoc, getFirestore } from 'firebase/firestore';

const VAPID_KEY = 'BF8YANm0BqhZBxT3mJLGN8GxbfOGQGK1234567890abcdefghijklmnopqrstuvwxyzABCDEF'; // You'll need to generate this

export interface FCMNotificationOptions {
  title: string;
  body: string;
  tone: 'funny' | 'kind' | 'motivational' | 'sarcastic' | 'strict' | 'supportive' | 'crass' | 'weightloss';
  vibrationPattern?: number[];
  data?: Record<string, string>;
}

class FCMService {
  private static instance: FCMService;
  private messaging: any = null;
  private currentToken: string | null = null;
  private initialized = false;

  private constructor() {
    this.initializeMessaging();
  }

  public static getInstance(): FCMService {
    if (!FCMService.instance) {
      FCMService.instance = new FCMService();
    }
    return FCMService.instance;
  }

  private async initializeMessaging() {
    if (typeof window === 'undefined') {
      console.warn('FCM: Window not available, skipping initialization');
      return;
    }

    try {
      // Register service worker
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('FCM Service Worker registered:', registration);
        
        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;
      }

      this.messaging = getMessaging(app);
      this.initialized = true;
      
      // Set up foreground message handling
      this.setupForegroundMessaging();
      
      console.log('FCM initialized successfully');
    } catch (error) {
      console.error('FCM initialization failed:', error);
    }
  }

  private setupForegroundMessaging() {
    if (!this.messaging) return;

    // Handle foreground messages
    onMessage(this.messaging, (payload: MessagePayload) => {
      console.log('FCM foreground message received:', payload);

      const { notification, data } = payload;
      
      if (notification) {
        // Show notification with vibration
        this.showForegroundNotification({
          title: notification.title || 'Water4WeightLoss',
          body: notification.body || 'Time to hydrate!',
          tone: (data?.tone as any) || 'kind',
          vibrationPattern: data?.vibrationPattern ? 
            data.vibrationPattern.split(',').map(Number) : 
            [200, 100, 200, 100, 200],
          data: data as Record<string, string>
        });
      }
    });
  }

  public async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined') {
      return 'denied';
    }

    if (!('Notification' in window)) {
      console.error('This browser does not support notifications');
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  public async getRegistrationToken(userId: string): Promise<string | null> {
    if (!this.initialized || !this.messaging) {
      console.error('FCM not initialized');
      return null;
    }

    try {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.warn('Notification permission not granted');
        return null;
      }

      const token = await getToken(this.messaging, { vapidKey: VAPID_KEY });
      
      if (token) {
        console.log('FCM registration token:', token);
        this.currentToken = token;
        
        // Save token to Firestore
        await this.saveTokenToFirestore(userId, token);
        
        return token;
      } else {
        console.warn('No registration token available');
        return null;
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  private async saveTokenToFirestore(userId: string, token: string) {
    try {
      const db = getFirestore(app);
      const tokenDoc = doc(db, 'fcm_tokens', userId);
      
      await setDoc(tokenDoc, {
        token,
        lastUpdated: new Date(),
        platform: this.getPlatformInfo(),
        userAgent: navigator.userAgent
      }, { merge: true });
      
      console.log('FCM token saved to Firestore');
    } catch (error) {
      console.error('Error saving FCM token to Firestore:', error);
    }
  }

  private getPlatformInfo() {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/android/.test(userAgent)) {
      return 'android';
    } else if (/iphone|ipad|ipod/.test(userAgent)) {
      return 'ios';
    } else if (/mac/.test(userAgent)) {
      return 'macos';
    } else if (/win/.test(userAgent)) {
      return 'windows';
    } else {
      return 'unknown';
    }
  }

  public async showForegroundNotification(options: FCMNotificationOptions) {
    const { title, body, tone, vibrationPattern, data } = options;

    // Trigger device vibration
    if ('vibrate' in navigator && vibrationPattern) {
      navigator.vibrate(vibrationPattern);
    }

    // Show browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      const toneEmojis = {
        funny: '😂',
        kind: '😊',
        motivational: '💪',
        sarcastic: '🙄',
        strict: '🧐',
        supportive: '🤗',
        crass: '💥',
        weightloss: '🏋️‍♀️'
      };

      const emoji = toneEmojis[tone] || '💧';

      const notification = new Notification(`${emoji} ${title}`, {
        body,
        icon: '/logo-128.png',
        badge: '/logo-128.png',
        tag: 'hydration-foreground',
        requireInteraction: false,
        silent: false,
        // vibrate: vibrationPattern || [200, 100, 200], // Not supported in standard NotificationOptions
        data: {
          ...data,
          tone,
          timestamp: Date.now().toString()
        }
      });

      // Handle notification click
      notification.onclick = () => {
        window.focus();
        notification.close();
        
        // Navigate based on data
        if (data?.action === 'log-water') {
          window.location.href = '/dashboard?action=log-water';
        } else {
          window.location.href = '/dashboard';
        }
      };

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);
    }
  }

  public getCurrentToken(): string | null {
    return this.currentToken;
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public async testNotification(userId: string, tone: string = 'kind') {
    try {
      const token = await this.getRegistrationToken(userId);
      if (!token) {
        throw new Error('No FCM token available');
      }

      // Show a test notification
      await this.showForegroundNotification({
        title: 'Test Notification',
        body: `This is a test ${tone} notification to verify FCM is working!`,
        tone: tone as any,
        vibrationPattern: [200, 100, 200, 100, 200],
        data: { test: 'true', tone }
      });

      return { success: true, token };
    } catch (error) {
      console.error('Test notification failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Export singleton instance
export const fcmService = FCMService.getInstance();

// Convenience functions
export async function initializeFCM(userId: string): Promise<string | null> {
  return await fcmService.getRegistrationToken(userId);
}

export async function showFCMNotification(options: FCMNotificationOptions) {
  return await fcmService.showForegroundNotification(options);
}

export async function requestFCMPermission(): Promise<NotificationPermission> {
  return await fcmService.requestPermission();
}

export async function testFCMNotification(userId: string, tone: string = 'kind') {
  return await fcmService.testNotification(userId, tone);
} 