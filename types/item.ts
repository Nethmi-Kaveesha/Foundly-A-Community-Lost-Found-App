// types/item.ts

// Define a separate type for location
export interface ItemLocation {
  address?: string;
  latitude?: number;
  longitude?: number;
}

// Main item interface
export interface Item {
  id?: string;                     // Firestore document ID
  title: string;                   // Item title
  description: string;             // Item description
  status: "Lost" | "Found";        // Lost or Found
  category: string;                // Item category
  userId?: string;                 // Firebase Auth user ID
  createdAt?: Date;                // Timestamp of creation

  // Optional fields
  photoURL?: string;               // Item image URL
  contactInfo?: string;            // Owner contact info (phone/email)
  location?: ItemLocation;         // Item location using ItemLocation type
  matchedItemId?: string;          // ID of matched item (if found)
}
