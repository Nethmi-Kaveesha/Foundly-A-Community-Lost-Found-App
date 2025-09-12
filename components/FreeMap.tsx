import React, { useState } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";

interface MapProps {
  initialLocation?: { lat: number; lng: number };
  onLocationSelect: (lat: number, lng: number) => void;
}

const FreeMap: React.FC<MapProps> = ({ initialLocation, onLocationSelect }) => {
  const [markerPosition, setMarkerPosition] = useState(initialLocation || null);

  // Handle map clicks
  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setMarkerPosition({ lat, lng });
        onLocationSelect(lat, lng);
      },
    });
    return null;
  };

  return (
    <MapContainer
      center={markerPosition || { lat: 0, lng: 0 }}
      zoom={13}
      style={{ height: "300px", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {markerPosition && <Marker position={markerPosition} />}
      <MapClickHandler />
    </MapContainer>
  );
};

export default FreeMap;
