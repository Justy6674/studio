import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getFunctions, Functions } from "firebase/functions";

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

/**
 * Firebase client-side singleton
 */
class FirebaseClient {
  private static instance: FirebaseClient;
  private _app: FirebaseApp | null = null;
  private _auth: Auth | null = null;
  private _db: Firestore | null = null;
  private _functions: Functions | null = null;
  private _initialized: boolean = false;

  private constructor() {
    // Private constructor prevents external instantiation
  }

  // Get the singleton instance
  public static getInstance(): FirebaseClient {
    if (!FirebaseClient.instance) {
      FirebaseClient.instance = new FirebaseClient();
    }
    return FirebaseClient.instance;
  }

  // Initialize Firebase but only once and only in browser
  private initialize(): void {
    // Skip if already initialized or not in browser
    if (this._initialized || typeof window === 'undefined') return;

    // Use existing app or initialize once
    this._app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    this._auth = getAuth(this._app);
    this._db = getFirestore(this._app);
    this._functions = getFunctions(this._app);
    this._initialized = true;
  }

  // Getters that initialize on first access
  get app(): FirebaseApp {
    if (!this._initialized) this.initialize();
    return this._app as FirebaseApp;
  }

  get auth(): Auth {
    if (!this._initialized) this.initialize();
    return this._auth as Auth;
  }

  get db(): Firestore {
    if (!this._initialized) this.initialize();
    return this._db as Firestore;
  }
  
  get functions(): Functions {
    if (!this._initialized) this.initialize();
    return this._functions as Functions;
  }
}

// Create our singleton instance
const firebaseClient = FirebaseClient.getInstance();

// Export only the initialized services
export const auth = typeof window !== 'undefined' ? firebaseClient.auth : undefined as unknown as Auth;
export const db = typeof window !== 'undefined' ? firebaseClient.db : undefined as unknown as Firestore;
export const functions = typeof window !== 'undefined' ? firebaseClient.functions : undefined as unknown as Functions;
export const app = typeof window !== 'undefined' ? firebaseClient.app : undefined as unknown as FirebaseApp;
