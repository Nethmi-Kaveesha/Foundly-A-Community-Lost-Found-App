// services/notificationService.ts
import { db } from "@/firebase";
import { addDoc, collection, doc, getDocs, serverTimestamp, updateDoc } from "firebase/firestore";

// Notification interface
export interface NotificationData {
  title: string;
  message: string;
  itemId?: string;        // Related item ID
  createdAt?: any;        // Firestore timestamp
  read?: boolean;         // Has the user seen it
}

// Send a notification to a specific user
export const sendNotification = async (
  userId: string,
  itemId: string,
  title: string,
  message: string
) => {
  try {
    const notificationsRef = collection(db, "users", userId, "notifications");
    await addDoc(notificationsRef, {
      title,
      message,
      itemId,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("Error sending notification:", err);
  }
};

// Fetch notifications for a user
export const getNotificationsForUser = async (userId: string) => {
  const notificationsRef = collection(db, "users", userId, "notifications");
  const snapshot = await getDocs(notificationsRef);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// Mark a notification as read
export const markNotificationRead = async (userId: string, notificationId: string) => {
  const notifDocRef = doc(db, "users", userId, "notifications", notificationId);
  await updateDoc(notifDocRef, { read: true });
};
