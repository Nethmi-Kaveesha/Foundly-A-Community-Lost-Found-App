// firebase.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import * as Auth from "firebase/auth";
import { initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyA0w4auw0CSlnbjQkuyYML1gNIvNCq00e4",
  authDomain: "foundlyapp.firebaseapp.com",
  projectId: "foundlyapp",
  storageBucket: "foundlyapp.firebasestorage.app",
  messagingSenderId: "157719197896",
  appId: "1:157719197896:web:07ce2be8a56bfd27d10dfd",
  measurementId: "G-6YG34W3NBM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase services
export const auth = initializeAuth(app, {
  // Types for getReactNativePersistence may not be present in some setups; use any to access it safely.
  persistence: (Auth as any).getReactNativePersistence
    ? (Auth as any).getReactNativePersistence(AsyncStorage)
    : undefined,
});
export const db = getFirestore(app);
export const storage = getStorage(app);