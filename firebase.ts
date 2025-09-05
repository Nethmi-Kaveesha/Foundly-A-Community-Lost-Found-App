// firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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
export const auth = getAuth(app);
export const db = getFirestore(app);
