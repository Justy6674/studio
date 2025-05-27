import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

console.log('🔍 Firebase Environment Debug:');
console.log('NEXT_PUBLIC_FIREBASE_API_KEY:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'SET' : 'UNDEFINED');
// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);

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