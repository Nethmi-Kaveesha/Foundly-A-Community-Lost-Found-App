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
import { sendNotification } from "./loactionnotificationService"; // your notification service

// Firestore collection reference
export const itemColRef = collection(db, "items");

// =================== Helper: Distance calculation ===================
const toRad = (x: number) => (x * Math.PI) / 180;

const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of Earth in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// =================== Firestore Functions ===================

// Create a new item
export const createItem = async (item: Item): Promise<string> => {
  if (!item.title || !item.status || !item.category || !item.contactInfo || !item.location) {
    throw new Error("Missing required fields: title, status, category, contactInfo, location");
  }

  const docRef = await addDoc(itemColRef, {
    ...item,
    createdAt: new Date(),
  });

  // Assign the generated ID
  const newItem: Item = { ...item, id: docRef.id };

  // Check for nearby items and assign matchedItemId if applicable
  await checkNearbyAndMatch(newItem);

  // Notify nearby users
  await notifyNearbyUsers(newItem);

  return docRef.id;
};

// Update existing item
export const updateItem = async (id: string, item: Item) => {
  const docRef = doc(db, "items", id);
  const { id: _id, ...itemData } = item;
  return await updateDoc(docRef, itemData);
};

// Delete item
export const deleteItem = async (id: string) => {
  const docRef = doc(db, "items", id);
  return await deleteDoc(docRef);
};

// Get all items
export const getAllItemData = async (): Promise<Item[]> => {
  const snapshot = await getDocs(itemColRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item));
};

// Get item by ID
export const getItemById = async (id: string): Promise<Item | null> => {
  const docRef = doc(db, "items", id);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Item) : null;
};

// Get all items by user
export const getAllItemByUserId = async (userId: string): Promise<Item[]> => {
  const q = query(itemColRef, where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item));
};

// =================== Nearby & Match ===================

// Get items near a location
export const getItemsNearLocation = async (
  lat: number,
  lng: number,
  radiusKm: number = 5
): Promise<Item[]> => {
  const allItems = await getAllItemData();
  return allItems.filter(item =>
    item.location?.lat !== undefined &&
    item.location?.lng !== undefined &&
    getDistanceKm(lat, lng, item.location.lat, item.location.lng) <= radiusKm
  );
};

// Check nearby items and assign matchedItemId if lost/found match exists
const checkNearbyAndMatch = async (item: Item, radiusKm: number = 5) => {
  if (!item.location?.lat || !item.location?.lng) return;

  const allItems = await getAllItemData();

  for (const other of allItems) {
    if (!other.location?.lat || !other.location?.lng) continue;
    if (!other.id || !item.id) continue;

    const distance = getDistanceKm(item.location.lat, item.location.lng, other.location.lat, other.location.lng);

    if (distance <= radiusKm && other.status !== item.status && !item.matchedItemId && !other.matchedItemId) {
      // Update both items with matched ID
      const itemRef = doc(db, "items", item.id);
      const otherRef = doc(db, "items", other.id);

      await updateDoc(itemRef, { matchedItemId: other.id });
      await updateDoc(otherRef, { matchedItemId: item.id });

      break; // Only match first nearby opposite status
    }
  }
};

// Notify nearby users
export const notifyNearbyUsers = async (item: Item, radiusKm: number = 5) => {
  if (!item.location?.lat || !item.location?.lng || !item.userId) return;

  const nearbyItems = await getItemsNearLocation(item.location.lat, item.location.lng, radiusKm);

  for (const nearbyItem of nearbyItems) {
    if (!nearbyItem.userId || nearbyItem.userId === item.userId) continue;

    await sendNotification(
      nearbyItem.userId,
      item.id || "",
      `Nearby ${item.status} item!`,
      `A ${item.category} titled "${item.title}" is near your location.`
    );
  }
};
