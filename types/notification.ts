import { db } from "@/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";

// ✅ Define Notification type
export interface Notification {
  id: string;
  userId: string;
  fromUserId: string;
  title: string;
  message: string;
  type?: string;
  itemId?: string;
  matchedItemId?: string;
  createdAt?: any; // Firestore timestamp
}

export const useNotifications = (userId: string) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const q = query(collection(db, "notifications"), where("userId", "==", userId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Notification[];
      setNotifications(notifList);
    });

    return () => unsubscribe();
  }, [userId]);

  return notifications;
};
