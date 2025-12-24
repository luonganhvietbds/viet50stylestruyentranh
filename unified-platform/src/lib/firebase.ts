// Firebase Configuration
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCXAFiZokyj4B_hSIRcDsdtXQCBNPLLXb0",
  authDomain: "lam-video-han-quoc.firebaseapp.com",
  databaseURL: "https://lam-video-han-quoc-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "lam-video-han-quoc",
  storageBucket: "lam-video-han-quoc.firebasestorage.app",
  messagingSenderId: "494725547099",
  appId: "1:494725547099:web:739e7a5b73127aed536b7e",
  measurementId: "G-X9G715XRHN"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Analytics (only in browser)
export const initAnalytics = async () => {
  if (typeof window !== 'undefined') {
    const supported = await isSupported();
    if (supported) {
      return getAnalytics(app);
    }
  }
  return null;
};

export default app;
