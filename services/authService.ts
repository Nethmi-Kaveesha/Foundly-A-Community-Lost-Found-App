import { auth } from "@/firebase";
import axios from "axios";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { Platform } from "react-native";

let BASE_URL = "";

if (__DEV__) {
  if (Platform.OS === "web") {
    BASE_URL = "http://192.168.<YOUR_IP>:5000"; // Replace <YOUR_IP> with your computer's IPv4
  } else if (Platform.OS === "android") {
    BASE_URL = "http://10.0.2.2:5000"; // Android emulator
  } else {
    BASE_URL = "http://localhost:5000"; // iOS simulator
  }
} else {
  BASE_URL = "https://your-production-backend.com";
}

export const login = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const logout = () => signOut(auth);

export const register = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password);

export const forgotPassword = async (email: string) => {
  try {
    const response = await axios.post(`${BASE_URL}/auth/forgot-password`, { email });
    return response.data;
  } catch (err) {
    console.error("Forgot password API error:", err);
    throw err;
  }
};
