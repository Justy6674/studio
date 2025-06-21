import * as admin from 'firebase-admin';

// Ensure service account key is available and valid before proceeding
const serviceAccountKey = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY;

// Function to validate JSON string before parsing
function isValidJSON(str: string | undefined): boolean {
  if (!str) return false;
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

// Check for presence of service account key during build/initialization
if (!serviceAccountKey) {
  throw new Error(
    'FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY environment variable is missing. ' +
    'This must be set in Vercel environment variables with the complete service account JSON.'
  );
}

// Validate that the service account key is valid JSON
if (!isValidJSON(serviceAccountKey)) {
  throw new Error(
    'FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY contains invalid JSON. ' +
    'Please ensure it contains the complete, valid service account JSON object.'
  );
}

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    // Parse service account key (already validated)
    const serviceAccount = JSON.parse(serviceAccountKey);
    
    // Verify essential fields exist in the service account object
    if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
      throw new Error('Service account JSON is missing required fields (project_id, private_key, or client_email)');
    }
    
    // Initialize with service account
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      // Additional config options can be added here if needed
    });
    
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error) {
    // Provide detailed error for troubleshooting
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Firebase Admin SDK initialization failed: ${errorMessage}`);
  }
} else {
  console.log('Firebase Admin SDK already initialized.');
}

// Export admin app and services
export const app = admin.apps[0] as admin.app.App;
export const auth = admin.auth(app);
export const firestore = admin.firestore(app);
// export const storage = admin.storage(app); // If using Firebase Storage admin features
