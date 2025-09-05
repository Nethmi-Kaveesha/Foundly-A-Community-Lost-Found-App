import { db } from "@/firebase";
import { Item } from "@/types/item";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where
} from "firebase/firestore";
import api from "./config/api";

// Reference to Firestore collection
export const itemColRef = collection(db, "items");

// =================== Firestore Functions ===================

// Create a new item (Lost/Found)
export const createItem = async (item: Item) => {
  const docRef = await addDoc(itemColRef, item);
  return docRef.id;
};

// Update an existing item
export const updateItem = async (id: string, item: Item) => {
  const docRef = doc(db, "items", id);
  const { id: _id, ...itemData } = item; // Exclude id from Firestore update
  return await updateDoc(docRef, itemData);
};

// Delete an item
export const deleteItem = async (id: string) => {
  const docRef = doc(db, "items", id);
  return await deleteDoc(docRef);
};

// Get all items
export const getAllItemData = async () => {
  const snapshot = await getDocs(itemColRef);
  const itemList = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  })) as Item[];
  return itemList;
};

// Get item by ID
export const getItemById = async (id: string) => {
  const docRef = doc(db, "items", id);
  const snapshot = await getDoc(docRef);
  const item = snapshot.exists()
    ? ({ id: snapshot.id, ...snapshot.data() } as Item)
    : null;
  return item;
};

// Get all items by a specific user
export const getAllItemByUserId = async (userId: string) => {
  const q = query(itemColRef, where("userId", "==", userId));
  const snapshot = await getDocs(q);
  const itemList = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  })) as Item[];
  return itemList;
};

// =================== Mock API (axios) for testing ===================

// Fetch all items from mock API
export const getAllItem = async () => {
  const res = await api.get("/item");
  return res.data;
};

// Add item via mock API
export const addItem = async (item: any) => {
  const res = await api.post("/item", item);
  return res.data;
};
