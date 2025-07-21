// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "learnoptionstrading-academy.firebaseapp.com",
  projectId: "learnoptionstrading-academy",
  storageBucket: "learnoptionstrading-academy.firebasestorage.app",
  messagingSenderId: "114973148274",
  appId: "1:114973148274:web:06d3812e9a5f1a5c372eeb",
  measurementId: "G-N4S23NKFG3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);