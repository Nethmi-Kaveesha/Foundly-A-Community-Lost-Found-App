"use client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import React, { useEffect, useState } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";

// Fix default marker icon
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  location?: { lat: number; lng: number };
  markers?: { lat: number; lng: number; title: string; status: string }[]; // nearby items
  zoom?: number;
}

const MapPicker: React.FC<MapPickerProps> = ({ onLocationSelect, location, markers = [], zoom = 5 }) => {
  const [markerPos, setMarkerPos] = useState<{ lat: number; lng: number } | null>(location || null);

  useEffect(() => {
    if (location) setMarkerPos(location);
  }, [location]);

  const LocationMarker = () => {
    const map = useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setMarkerPos({ lat, lng });
        onLocationSelect(lat, lng);
      },
    });

    useEffect(() => {
      if (location) map.setView([location.lat, location.lng], map.getZoom());
    }, [location]);

    return (
      <>
        {markerPos && <Marker position={markerPos} />}
        {markers.map((m, idx) => (
          <Marker key={idx} position={{ lat: m.lat, lng: m.lng }} title={`${m.title} (${m.status})`} />
        ))}
      </>
    );
  };

  return (
    <div style={{ height: "300px", width: "100%", marginBottom: "12px" }}>
      <MapContainer center={[location?.lat || 20, location?.lng || 77]} zoom={zoom} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <LocationMarker />
      </MapContainer>
    </div>
  );
};

export default MapPicker;
