// types/item.ts
export interface ItemLocation {
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface Item {
  id?: string;
  title: string;
  description: string;
  status: "Lost" | "Found";
  category: string;
  userId?: string;
  createdAt?: Date;

  // Optional fields
  photoURL?: string;
  contactInfo?: string;
  location?: ItemLocation; // Use the new type
  matchedItemId?: string;
}
