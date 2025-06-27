'use client';

// Push notification utility functions

export interface NotificationOptions {
  title: string;
  message: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
}

class NotificationService {
  private static instance: NotificationService;
  private permission: NotificationPermission = 'default';

  private constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return 'denied';
    }

    if (this.permission === 'granted') {
      return 'granted';
    }

    if (this.permission === 'denied') {
      return 'denied';
    }

    try {
      this.permission = await Notification.requestPermission();
      return this.permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  public async showNotification(options: NotificationOptions): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (this.permission !== 'granted') {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        return false;
      }
    }

    try {
      const notification = new Notification(options.title, {
        body: options.message,
        icon: options.icon || '/logo-128.png',
        badge: options.badge || '/logo-128.png',
        tag: options.tag || 'hydration-motivation',
        requireInteraction: options.requireInteraction || false,
        silent: false,
      });

      // Auto-close after 5 seconds if not requiring interaction
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 5000);
      }

      // Handle notification click
      notification.onclick = () => {
        window.focus();
        notification.close();
        // Navigate to dashboard if not already there
        if (window.location.pathname !== '/dashboard') {
          window.location.href = '/dashboard';
        }
      };

      return true;
    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
  }

  public getPermissionStatus(): NotificationPermission {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'denied';
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }
}

// Convenience functions
export const notificationService = NotificationService.getInstance();

// Forward declaration for useAuth, assuming it's available and exports getFreshIdToken
// Actual import might be: import { useAuth } from '@/contexts/AuthContext';
// const { getFreshIdToken } = useAuth(); // This would be used within an async function context if needed directly here
// For now, we'll assume getFreshIdToken is passed or accessible where sendHydrationSmsReminder is called.

export async function showMotivationNotification(message: string, tone: string = 'kind'): Promise<boolean> {
  const toneEmojis: Record<string, string> = {
    kind: '😊',    // Kind & Gentle
    strict: '🧐',   // Strict & Direct
    funny: '😂',    // Funny & Lighthearted
    kick: '💥',     // Kick My Ass!
    default: '💧'   // Default/Fallback
  };

  const emoji = toneEmojis[tone] || '💧';
  
  return await notificationService.showNotification({
    title: `${emoji} Hydration Motivation`,
    message: message,
    tag: 'hydration-motivation',
    requireInteraction: false
  });
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  return await notificationService.requestPermission();
}

export function isNotificationSupported(): boolean {
  return notificationService.isSupported();
} 

export async function sendHydrationSmsReminder(
  phoneNumber: string, 
  messageBody: string, 
  tone: string, 
  getFreshIdToken: () => Promise<string | null> // Function to get ID token
): Promise<{ success: boolean; type: 'sms' | 'popup' | 'error'; error?: string }> {
  if (!phoneNumber) {
    console.warn('No phone number provided for SMS reminder.');
    // Fallback to in-app popup if phone number is missing
    await showMotivationNotification(`Reminder: ${messageBody}`, tone);
    return { success: true, type: 'popup', error: 'No phone number' };
  }

  try {
    // SMS functionality temporarily disabled during Firebase Functions migration
    console.log('SMS functionality temporarily disabled during Firebase Functions migration');
    await showMotivationNotification(`Reminder (SMS disabled): ${messageBody}`, tone);
    return { success: true, type: 'popup', error: 'SMS temporarily disabled' };
  } catch (error) {
    console.error('Error in sendHydrationSmsReminder:', error);
    // Fallback to in-app popup on unexpected errors
    await showMotivationNotification(`Reminder (network error): ${messageBody}`, tone);
    return { success: false, type: 'popup', error: 'Network or unexpected error' };
  }
}