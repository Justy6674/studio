import * as admin from 'firebase-admin';

// Only use mock Firebase during actual Next.js build process, not development
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                   process.env.VERCEL_ENV === 'preview';

// Create mock admin interfaces and implementations
interface MockApp {
  name: string;
  options: Record<string, unknown>;
  auth(): typeof mockAuth;
  firestore(): typeof mockFirestore;
}

const mockAuth = {
  verifyIdToken: async () => ({ uid: 'mock-user-id' }),
  getUser: async () => ({ uid: 'mock-user-id', email: 'mock@example.com' })
};

const mockFirestore = {
  collection: (path: string) => ({
    doc: (docId: string) => ({
      get: async () => ({ exists: false, data: () => null }),
      set: async () => ({}),
      update: async () => ({}),
      delete: async () => ({})
    }),
    add: async () => ({ id: 'mock-doc-id' }),
    where: () => ({ get: async () => ({ docs: [] }) })
  }),
  doc: (path: string) => ({
    get: async () => ({ exists: false, data: () => null }),
    set: async () => ({}),
    update: async () => ({}),
    delete: async () => ({})
  })
};

// Create mock admin app
class MockAdminApp implements MockApp {
  name = 'mock-app';
  options = {};
  auth() { return mockAuth; }
  firestore() { return mockFirestore; }
}

// Define exports
let app: admin.app.App;
let auth: admin.auth.Auth;
let firestore: admin.firestore.Firestore;

// Initialize either mock or real Firebase Admin based on environment
if (isBuildTime) {
  // For build time, use mocks to avoid errors
  console.log('Build environment detected - using mock Firebase Admin');
  app = new MockAdminApp() as unknown as admin.app.App;
  auth = mockAuth as unknown as admin.auth.Auth;
  firestore = mockFirestore as unknown as admin.firestore.Firestore;
} else {
  // Initialize Firebase Admin for real Firebase project
  const serviceAccountKey = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY;
  const isServerContext = typeof window === 'undefined';
  let serviceAccountValid = false;
  
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
  
  // Validate the service account key if present
  if (serviceAccountKey) {
    if (!isValidJSON(serviceAccountKey)) {
      console.error(
        'FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY contains invalid JSON. ' +
        'Please ensure it contains the complete, valid service account JSON object.'
      );
    } else {
      serviceAccountValid = true;
    }
  } else if (isServerContext) {
    console.error(
      'FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY environment variable is missing. ' +
      'This must be set in Vercel environment variables with the complete service account JSON.'
    );
  }
  
  // Initialize Firebase Admin SDK only when service account is valid
  if (!admin.apps.length) {
    try {
      // Only initialize if we have a valid service account
      if (serviceAccountValid && serviceAccountKey) {
        // Parse service account key (already validated)
        const serviceAccount = JSON.parse(serviceAccountKey);
        
        // Verify essential fields exist in the service account object
        if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
          console.error('Service account JSON is missing required fields (project_id, private_key, or client_email)');
        } else {
          // Initialize with service account
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          });
          
          console.log('Firebase Admin SDK initialized successfully.');
        }
      } else if (!isServerContext) {
        // During build, use a dummy app to avoid errors
        admin.initializeApp({
          projectId: 'build-time-placeholder'
        });
        console.log('Firebase Admin SDK initialized with placeholder during build.');
      } else {
        // Fallback: Initialize with project ID for development
        admin.initializeApp({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'hydrateai-ayjow',
        });
        console.log('Firebase Admin SDK initialized with project ID fallback for development.');
      }
    } catch (error) {
      // Provide detailed error for troubleshooting but don't break the build
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (isServerContext) {
        console.error(`Firebase Admin SDK initialization error: ${errorMessage}`);
      } else {
        console.warn(`Firebase Admin SDK initialization warning during build: ${errorMessage}`);
      }
    }
  } else {
    console.log('Firebase Admin SDK already initialized.');
  }
  
  // Set exports to real Firebase Admin instances (or undefined if init failed)
  if (admin.apps.length > 0 && admin.apps[0] !== null) {
    app = admin.apps[0] as admin.app.App;
    auth = admin.auth(app);
    firestore = admin.firestore(app);
  } else {
    // If initialization failed, use mocks as fallback
    console.warn('Firebase Admin SDK initialization failed - using mock implementations as fallback');
    app = new MockAdminApp() as unknown as admin.app.App;
    auth = mockAuth as unknown as admin.auth.Auth;
    firestore = mockFirestore as unknown as admin.firestore.Firestore;
  }
}

// Export the admin app and services
export { app, auth, firestore };

// Also export the admin namespace for direct access
export { admin };
