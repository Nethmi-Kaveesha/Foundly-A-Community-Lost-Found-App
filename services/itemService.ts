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

// Reference to Firestore collection
export const itemColRef = collection(db, "items");

// =================== Firestore Functions ===================

// Create a new item (Lost/Found)
export const createItem = async (item: Item) => {
  const docRef = await addDoc(itemColRef, {
    ...item,
    createdAt: item.createdAt || new Date(), // ensure timestamp
  });
  return docRef.id;
};

// Update an existing item
export const updateItem = async (id: string, item: Item) => {
  const docRef = doc(db, "items", id);
  const { id: _id, ...itemData } = item; // exclude id
  return await updateDoc(docRef, itemData);
};

// Delete an item
export const deleteItem = async (id: string) => {
  const docRef = doc(db, "items", id);
  return await deleteDoc(docRef);
};

// Get all items
export const getAllItemData = async (): Promise<Item[]> => {
  const snapshot = await getDocs(itemColRef);
  const itemList = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  })) as Item[];
  return itemList;
};

// Get item by ID
export const getItemById = async (id: string): Promise<Item | null> => {
  const docRef = doc(db, "items", id);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Item) : null;
};

// Get all items by a specific user
export const getAllItemByUserId = async (userId: string): Promise<Item[]> => {
  const q = query(itemColRef, where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Item));
};

// =================== Optional: Get items near a location ===================
// Simple proximity filter (distance in km)
export const getItemsNearLocation = async (
  lat: number,
  lng: number,
  radiusKm: number = 5
): Promise<Item[]> => {
  const allItems = await getAllItemData();
  const toRad = (x: number) => (x * Math.PI) / 180;

  const distance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  return allItems.filter(
    (item) =>
      item.location?.lat !== undefined &&
      item.location?.lng !== undefined &&
      distance(lat, lng, item.location.lat, item.location.lng) <= radiusKm
  );
};
