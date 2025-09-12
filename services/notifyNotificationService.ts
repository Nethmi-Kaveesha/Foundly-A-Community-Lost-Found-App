import { db } from "@/firebase"; // your firebase config
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

// Reference to notifications collection
export const notificationsColRef = collection(db, "notifications");

export interface NotificationData {
  toUserId: string;
  fromUserId: string;
  title: string;
  message: string;
  type?: string;
  itemId?: string;
  matchedItemId?: string;
}

export const addNotification = async (data: NotificationData) => {
  try {
    const docRef = await addDoc(notificationsColRef, {
      userId: data.toUserId,
      fromUserId: data.fromUserId,
      title: data.title,
      message: data.message,
      type: data.type || "general",
      itemId: data.itemId || null,
      matchedItemId: data.matchedItemId || null,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (err) {
    console.error("Failed to add notification:", err);
    throw err;
  }
};
