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

export async function showMotivationNotification(message: string, tone: string = 'Default'): Promise<boolean> {
  const toneEmojis: Record<string, string> = {
    Clinical: '🔬',
    Funny: '😄',
    Sarcastic: '😏',
    Warm: '🤗',
    Default: '💧'
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