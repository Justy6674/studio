import * as admin from 'firebase-admin';

const serviceAccountKey = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY;

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(serviceAccountKey as string)),
      // databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com` // Optional: if using Realtime Database
    });
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error) {
    console.error('Firebase Admin SDK initialization error:', error);
    // Prevent app from starting if admin SDK fails to initialize, as it's critical for some backend functions
    // throw new Error('Firebase Admin SDK failed to initialize. Check service account key and config.'); 
    // Or handle more gracefully depending on how critical admin functions are at startup
  }
} else {
  // console.log('Firebase Admin SDK already initialized.');
}

export const app = admin.apps[0] as admin.app.App;
export const auth = admin.auth(app);
export const firestore = admin.firestore(app);
// export const storage = admin.storage(app); // If using Firebase Storage admin features

// You might want to ensure environment variables are correctly loaded and parsed.
// Consider using a library like `dotenv` if not already handled by your framework (Next.js handles .env.local etc.)
if (!serviceAccountKey) {
  console.warn('FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY is not set. Firebase Admin SDK features requiring authentication will not work.');
  // Depending on your app's needs, you might throw an error here or allow the app to run with limited admin capabilities.
}
