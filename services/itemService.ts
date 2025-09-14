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
  where,
} from "firebase/firestore";

export const itemColRef = collection(db, "items");

// =================== Haversine formula ===================
const toRad = (x: number) => (x * Math.PI) / 180;

const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// =================== Firestore CRUD ===================

// Create a new item
export const createItem = async (item: Item): Promise<string> => {
  if (!item.title || !item.status || !item.category || !item.contactInfo || !item.location) {
    throw new Error("Missing required fields");
  }
  const docRef = await addDoc(itemColRef, {
    ...item,
    createdAt: new Date(),
  });
  return docRef.id;
};

// Update item
export const updateItem = async (id: string, item: Item) => {
  const docRef = doc(db, "items", id);
  const { id: _id, ...data } = item;
  return await updateDoc(docRef, data);
};

// Delete item
export const deleteItem = async (id: string) => {
  const docRef = doc(db, "items", id);
  return await deleteDoc(docRef);
};

// Get all items
export const getAllItemData = async (): Promise<Item[]> => {
  const snapshot = await getDocs(itemColRef);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Item));
};

// Get item by ID
export const getItemById = async (id: string): Promise<Item | null> => {
  const docRef = doc(db, "items", id);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Item) : null;
};

// Get items by user
export const getAllItemByUserId = async (userId: string): Promise<Item[]> => {
  const q = query(itemColRef, where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Item));
};

// =================== Get nearby items ===================
// Firestore doesn't support geo queries natively, so we fetch all items within approximate bounding box
export const getNearbyItems = async (
  lat: number,
  lng: number,
  radiusKm: number = 5
): Promise<Item[]> => {
  const allItems = await getAllItemData();
  return allItems.filter(
    (item) =>
      item.location?.lat != null &&
      item.location?.lng != null &&
      getDistanceKm(lat, lng, item.location.lat, item.location.lng) <= radiusKm
  );
};
