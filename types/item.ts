export interface Item {
  id?: string              
  title: string             
  description: string       
  status: "Lost" | "Found"  
  category: string          
  userId?: string           
  createdAt?: Date          

  // New / optional fields
  photoURL?: string        
  contactInfo?: string      
  location?: {              
    address?: string        
    latitude?: number       
    longitude?: number      
  }
  matchedItemId?: string    // ID of the item it is matched with (if found)
}
