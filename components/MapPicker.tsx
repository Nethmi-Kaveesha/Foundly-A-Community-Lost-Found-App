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
  markers?: { lat: number; lng: number; title: string; status: string; id?: string }[];
  zoom?: number;
}

const MapPicker: React.FC<MapPickerProps> = ({ onLocationSelect, location, markers = [], zoom = 5 }) => {
  const [markerPos, setMarkerPos] = useState<{ lat: number; lng: number } | null>(location || null);
  const [searchQuery, setSearchQuery] = useState("");

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

  // Search location function using Nominatim
  const searchLocation = async () => {
    if (!searchQuery) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const latNum = parseFloat(lat);
        const lonNum = parseFloat(lon);
        setMarkerPos({ lat: latNum, lng: lonNum });
        onLocationSelect(latNum, lonNum);
      } else {
        alert("Location not found");
      }
    } catch (err) {
      console.error(err);
      alert("Error searching location");
    }
  };

  return (
    <div style={{ width: "100%", marginBottom: "12px" }}>
      {/* Search Bar */}
      <div style={{ display: "flex", marginBottom: "8px" }}>
        <input
          type="text"
          placeholder="Search location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "1px solid #ccc" }}
        />
        <button
          onClick={searchLocation}
          style={{ marginLeft: "8px", padding: "8px 12px", borderRadius: "8px", backgroundColor: "#3B82F6", color: "white" }}
        >
          Go
        </button>
      </div>

      {/* Map */}
      <div style={{ height: "300px", width: "100%" }}>
        <MapContainer center={[location?.lat || 20, location?.lng || 77]} zoom={zoom} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <LocationMarker />
        </MapContainer>
      </div>
    </div>
  );
};

export default MapPicker;
