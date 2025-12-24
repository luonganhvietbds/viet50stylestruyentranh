import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAxIa0d9vO6dzq1jNmsRhWKpqkVhZPYzSw",
  authDomain: "stylejsonscene.firebaseapp.com",
  databaseURL: "https://stylejsonscene-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "stylejsonscene",
  storageBucket: "stylejsonscene.firebasestorage.app",
  messagingSenderId: "443213265614",
  appId: "1:443213265614:web:764f04b0cf26a5f8666e9f",
  measurementId: "G-VJ85FPX95G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };