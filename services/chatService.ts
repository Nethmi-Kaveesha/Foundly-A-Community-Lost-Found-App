// services/chatService.ts
import { db } from "@/firebase";
import { addDoc, collection, doc, getDoc, orderBy, query, setDoc } from "firebase/firestore";

export const createOrGetChat = async (userId1: string, userId2: string) => {
  const chatId = [userId1, userId2].sort().join("_");
  const chatRef = doc(db, "chats", chatId);

  const chatSnap = await getDoc(chatRef);
  if (!chatSnap.exists()) {
    await setDoc(chatRef, { participants: [userId1, userId2] });
  }

  return chatRef;
};

export const sendMessage = async (chatId: string, senderId: string, text: string) => {
  const messagesRef = collection(db, "chats", chatId, "messages");
  await addDoc(messagesRef, { senderId, text, timestamp: Date.now() });
};

export const getMessagesQuery = (chatId: string) => {
  return query(collection(db, "chats", chatId, "messages"), orderBy("timestamp", "asc"));
};
