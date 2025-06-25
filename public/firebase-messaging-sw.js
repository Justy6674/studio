// Firebase Cloud Messaging Service Worker
// Handles background push notifications and vibrations

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/11.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.8.1/firebase-messaging-compat.js');

// Firebase configuration - loaded dynamically to avoid exposing secrets
let firebaseConfig = null;

// Function to get Firebase config from main app
async function getFirebaseConfig() {
  if (firebaseConfig) return firebaseConfig;
  
  try {
    // Get config from main app's window object or fetch from API
    const response = await fetch('/api/firebase-config');
    if (response.ok) {
      firebaseConfig = await response.json();
    } else {
      // Fallback - this should be set by the main app
      firebaseConfig = self.FIREBASE_CONFIG || {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
      };
    }
  } catch (error) {
    console.error('Failed to load Firebase config:', error);
    // Use minimal config for service worker
    firebaseConfig = {
      apiKey: "PLACEHOLDER_API_KEY",
      authDomain: "PLACEHOLDER_AUTH_DOMAIN",
      projectId: "PLACEHOLDER_PROJECT_ID",
      storageBucket: "PLACEHOLDER_STORAGE_BUCKET",
      messagingSenderId: "PLACEHOLDER_SENDER_ID",
      appId: "PLACEHOLDER_APP_ID"
    };
  }
  
  return firebaseConfig;
}

// Initialize Firebase when config is available
let messaging = null;

async function initializeFirebase() {
  const config = await getFirebaseConfig();
  firebase.initializeApp(config);
  messaging = firebase.messaging();
  setupMessageHandlers();
}

function setupMessageHandlers() {
  if (!messaging) return;

  // Handle background messages
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

// Initialize Firebase on service worker startup
initializeFirebase().catch(console.error);

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