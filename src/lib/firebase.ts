
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

// Debug logging for environment variables
console.log("🔍 Firebase Environment Debug:");
console.log("NEXT_PUBLIC_FIREBASE_API_KEY:", process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "SET" : "UNDEFINED");
console.log("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:", process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? "SET" : "UNDEFINED");
console.log("NEXT_PUBLIC_FIREBASE_PROJECT_ID:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "SET" : "UNDEFINED");
console.log("All env keys:", Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_FIREBASE')));
console.log("Actual values check:", {
  apiKey: !!firebaseConfig.apiKey,
  authDomain: !!firebaseConfig.authDomain,
  projectId: !!firebaseConfig.projectId,
  storageBucket: !!firebaseConfig.storageBucket,
  messagingSenderId: !!firebaseConfig.messagingSenderId,
  appId: !!firebaseConfig.appId
});

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate required config
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
const missingConfigVars = Object.entries(firebaseConfig).filter(([key, value]) => !value).map(([key]) => key);

if (missingVars.length > 0) {
  console.error('Missing required Firebase environment variables:', missingVars);
}
if (missingConfigVars.length > 0) {
  console.error('Firebase config has undefined values for:', missingConfigVars);
}

let app, auth, db, functions;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  functions = getFunctions(app);
} catch (error) {
  console.error('Firebase initialization error:', error);
}

export { auth, db, functions };

// Firebase Configuration Test
async function testFirebaseConfig() {
  console.log("🧪 Testing Firebase Configuration...");
  
  try {
    // Test 1: Anonymous Authentication
    console.log("📧 Testing Firebase Auth...");
    if (!auth) {
      throw new Error("Firebase Auth not initialized");
    }
    
    const authResult = await signInAnonymously(auth);
    console.log("✅ Firebase Auth SUCCESS:", {
      uid: authResult.user.uid,
      isAnonymous: authResult.user.isAnonymous
    });
    
    // Test 2: Firestore Write
    console.log("📝 Testing Firestore Write...");
    if (!db) {
      throw new Error("Firestore not initialized");
    }
    
    const testDoc = await addDoc(collection(db, "test"), {
      timestamp: Date.now(),
      message: "Firebase config test",
      createdAt: new Date()
    });
    
    console.log("✅ Firestore Write SUCCESS:", {
      docId: testDoc.id,
      collection: "test"
    });
    
    console.log("🎉 Firebase Configuration Test: ALL TESTS PASSED");
    
  } catch (error) {
    console.error("❌ Firebase Configuration Test FAILED:", error);
    console.error("Error details:", {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
  }
}

// Run the test when this module loads (only once)
if (typeof window !== 'undefined' && !window.__FIREBASE_CONFIG_TESTED__) {
  window.__FIREBASE_CONFIG_TESTED__ = true;
  testFirebaseConfig();
}
