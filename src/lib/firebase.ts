/**
 * Firebase Configuration
 * 
 * Firebase services used:
 * - Authentication (Email/Password)
 * - Firestore Database (data storage)
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration - these are publishable client-side keys
export const firebaseConfig = {
  apiKey: "AIzaSyCF3tVnsRjeTQXDUSVlivKAtmvQ4qZcHcg",
  authDomain: "planning-with-anaiysis.firebaseapp.com",
  projectId: "planning-with-anaiysis",
  storageBucket: "planning-with-anaiysis.firebasestorage.app",
  messagingSenderId: "423072295050",
  appId: "1:423072295050:web:eaee2a34df590379ebe573"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
