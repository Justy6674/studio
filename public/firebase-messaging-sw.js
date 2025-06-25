// Firebase Cloud Messaging Service Worker
// Handles background push notifications and vibrations
// Environment variables are injected at build time

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/11.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.8.1/firebase-messaging-compat.js');

// Firebase configuration - loaded from API endpoint
let firebaseConfig = null;
let messaging = null;

// Load Firebase config and initialize
async function initializeFirebase() {
  try {
    const response = await fetch('/api/firebase-config');
    firebaseConfig = await response.json();
    
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    
    // Initialize Firebase Cloud Messaging
    messaging = firebase.messaging();
    
    console.log('[firebase-messaging-sw.js] Firebase initialized successfully');
    return true;
  } catch (error) {
    console.error('[firebase-messaging-sw.js] Failed to initialize Firebase:', error);
    return false;
  }
}

// Initialize Firebase when service worker loads
initializeFirebase();

// Handle background messages (setup after Firebase is initialized)
async function setupBackgroundMessageHandler() {
  const initialized = await initializeFirebase();
  if (!initialized || !messaging) {
    console.error('[firebase-messaging-sw.js] Cannot setup background message handler - Firebase not initialized');
    return;
  }

  messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'Water4WeightLoss';
  const notificationOptions = {
    body: payload.notification?.body || 'Time to hydrate!',
    icon: '/logo-128.png',
    badge: '/logo-128.png',
    tag: 'hydration-reminder',
    requireInteraction: false,
    silent: false,
    vibrate: [200, 100, 200, 100, 200], // Vibration pattern
    data: {
      ...payload.data,
      timestamp: Date.now(),
      url: payload.data?.url || '/dashboard'
    },
    actions: [
      {
        action: 'log-water',
        title: '💧 Log Water',
        icon: '/logo-128.png'
      },
      {
        action: 'snooze',
        title: '⏰ Snooze 30min',
        icon: '/logo-128.png'
      }
    ]
  };

  // Trigger device vibration for mobile and smartwatch
  if ('vibrate' in navigator) {
    navigator.vibrate([200, 100, 200, 100, 200]);
  }

  return self.registration.showNotification(notificationTitle, notificationOptions);
  });
}

// Setup background message handler
setupBackgroundMessageHandler();

// Handle notification click events
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received:', event);

  event.notification.close();

  const action = event.action;
  const notificationData = event.notification.data;

  if (action === 'log-water') {
    // Open app and trigger water logging
    event.waitUntil(
      clients.openWindow('/dashboard?action=log-water')
    );
  } else if (action === 'snooze') {
    // Schedule another notification in 30 minutes
    console.log('Snooze action triggered - will implement scheduling');
    // Note: Actual snooze scheduling would be handled by the main app
  } else {
    // Default action - open the app
    const urlToOpen = notificationData?.url || '/dashboard';
    event.waitUntil(
      clients.openWindow(urlToOpen)
    );
  }

  // Trigger vibration on click
  if ('vibrate' in navigator) {
    navigator.vibrate([100, 50, 100]);
  }
});

// Handle notification close events
self.addEventListener('notificationclose', (event) => {
  console.log('[firebase-messaging-sw.js] Notification closed:', event);
  
  // Analytics could be tracked here
  const notificationData = event.notification.data;
  
  // Send analytics event to track notification dismissal
  if (notificationData?.userId) {
    // This would send to analytics endpoint
    console.log('Notification dismissed by user:', notificationData.userId);
  }
});

// Handle push events directly (for additional control)
self.addEventListener('push', (event) => {
  console.log('[firebase-messaging-sw.js] Push event received:', event);
  
  if (event.data) {
    const payload = event.data.json();
    console.log('Push payload:', payload);
    
    // Enhanced vibration for direct push events
    if ('vibrate' in navigator && payload.data?.vibrate) {
      const pattern = payload.data.vibrate.split(',').map(Number) || [200, 100, 200];
      navigator.vibrate(pattern);
    }
  }
});

// Service worker installation
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Service worker installing...');
  self.skipWaiting();
});

// Service worker activation
self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service worker activating...');
  event.waitUntil(self.clients.claim());
}); 