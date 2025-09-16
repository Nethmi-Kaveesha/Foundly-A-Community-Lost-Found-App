// Type for a marker on the map
export interface MarkerType {
  id: string;         // Unique ID
  lat: number;        // Latitude
  lng: number;        // Longitude
  title?: string;     // Optional popup text
  item?: any;         // Optional: reference to the Item object (for popups)
  
}

// Props for MapPicker component
export interface MapPickerProps {
  location?: { lat: number; lng: number };                // Initial location
  markers?: MarkerType[];                                 // Array of markers
  onLocationSelect: (lat: number, lng: number) => void;  // Callback when user selects a location
  onAddressChange?: (address: string) => void;           // Optional: address update
  onMarkerPress?: (item: any) => void;                   // ✅ Add this to fix your error
}
