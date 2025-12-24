
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

// Helper to safely access environment variables in both Vite and non-Vite environments.
const getEnv = (key: string, fallback: string) => {
  // Try import.meta.env first (Vite)
  try {
    const meta = import.meta as any;
    if (meta && meta.env && meta.env[key]) {
      return meta.env[key];
    }
  } catch (e) {
    // Ignore error
  }

  // Fallback to process.env
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env) {
      // @ts-ignore
      const val = process.env[key] || process.env[`REACT_APP_${key.replace('VITE_', '')}`];
      if (val) return val;
    }
  } catch (e) {
    // Ignore error
  }
  return fallback;
};

const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY', 'AIzaSyBAiQujVe4e3dPUxPpz-kn7po3hYBv--tI'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN', 'vietkichban16styles.firebaseapp.com'),
  databaseURL: getEnv('VITE_FIREBASE_DATABASE_URL', 'https://vietkichban16styles-default-rtdb.asia-southeast1.firebasedatabase.app'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID', 'vietkichban16styles'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET', 'vietkichban16styles.firebasestorage.app'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '382110581062'),
  appId: getEnv('VITE_FIREBASE_APP_ID', '1:382110581062:web:b89b9baf02f87794a46547'),
  measurementId: getEnv('VITE_FIREBASE_MEASUREMENT_ID', 'G-YH6774VLJW')
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics conditionally
let analytics;
try {
  if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
  }
} catch (e) {
  console.warn("Firebase Analytics could not be initialized:", e);
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export default app;
