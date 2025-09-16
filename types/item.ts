// Location type
export interface ItemLocation {
  address?: string;  // Optional user-friendly address
  lat?: number;      // Latitude
  lng?: number;      // Longitude
}

// Main item interface
export interface Item {
  id?: string;                    // Firestore document ID
  title: string;                  // Item title
  description: string;            // Item description
  status: "Lost" | "Found";       // Lost or Found
  category: string;               // Item category
  userId?: string;                // Firebase Auth user ID
  createdAt?: Date;               // Timestamp of creation

  photoURL?: string;              // Item image URL
  contactInfo?: string;           // Owner contact info
  location?: ItemLocation;        // Item location
  matchedItemId?: string;         // Matched item ID if found

  isVerified?: boolean; // ✅ add this

  resolved?: boolean; // ✅ add this
}
