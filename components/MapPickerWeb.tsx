"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import React, { useEffect, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { MapPickerProps } from "./MapPicker.types";

// Fix default marker icons
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});
L.Marker.prototype.options.icon = DefaultIcon;

const MapPickerWeb: React.FC<MapPickerProps> = ({ location, onLocationSelect, markers = [] }) => {
  const [selected, setSelected] = useState(location ?? null);
  const [searchInput, setSearchInput] = useState("");

  // Sync selected state when location prop changes (important for editing)
  useEffect(() => {
    if (location) {
      setSelected(location);

      // Reverse geocode to show address in text field
      (async () => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}`
          );
          const data = await res.json();
          if (data?.display_name) setSearchInput(data.display_name);
        } catch {
          console.warn("Failed to reverse geocode location");
        }
      })();
    }
  }, [location]);

  // Handle map click
  const handleMapClick = (e: any) => {
    const { lat, lng } = e.latlng;
    setSelected({ lat, lng });
    onLocationSelect(lat, lng);

    // Reverse geocode clicked location
    (async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
        );
        const data = await res.json();
        if (data?.display_name) setSearchInput(data.display_name);
      } catch {
        console.warn("Failed to reverse geocode clicked location");
      }
    })();
  };

  // Search typed address
  const handleLocateAddress = async () => {
    if (!searchInput.trim()) return alert("Please type a location");

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchInput)}`
      );
      const data = await res.json();
      if (data.length > 0) {
        const { lat, lon } = data[0];
        const coords = { lat: parseFloat(lat), lng: parseFloat(lon) };
        setSelected(coords);
        onLocationSelect(coords.lat, coords.lng);
      } else {
        alert("Location not found");
      }
    } catch {
      alert("Failed to locate address");
    }
  };

  return (
    <div style={{ height: "100%", width: "100%" }}>
      {/* Address search input */}
      <div style={{ display: "flex", marginBottom: 8 }}>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Type location"
          style={{ flex: 1, padding: 8, borderRadius: 8, border: "1px solid #ccc" }}
        />
        <button
          onClick={handleLocateAddress}
          style={{ marginLeft: 4, padding: "8px 16px", borderRadius: 8, backgroundColor: "#3B82F6", color: "#fff" }}
        >
          Go
        </button>
      </div>

      <MapContainer
        center={[location?.lat ?? 37.7749, location?.lng ?? -122.4194]}
        zoom={13}
        style={{ height: "400px", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapClick onClick={handleMapClick} />
        <FlyToMarker location={selected} />

        {/* Selected marker */}
        {selected && (
          <Marker position={[selected.lat, selected.lng]}>
            <Popup>Selected Location</Popup>
          </Marker>
        )}

        {/* Extra markers */}
        {markers.map((m) => (
          <Marker key={m.id} position={[m.lat, m.lng]}>
            {m.title && <Popup>{m.title}</Popup>}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

// Handle map clicks
const MapClick: React.FC<{ onClick: (e: any) => void }> = ({ onClick }) => {
  useMapEvents({ click: onClick });
  return null;
};

// Fly to selected marker
const FlyToMarker: React.FC<{ location: { lat: number; lng: number } | null }> = ({ location }) => {
  const map = useMap();
  useEffect(() => {
    if (location) map.flyTo([location.lat, location.lng], 13);
  }, [location, map]);
  return null;
};

export default MapPickerWeb;
