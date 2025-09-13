import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { WebView } from "react-native-webview";
import type { MapPickerProps } from "./MapPicker.types";

const MapPickerMobile: React.FC<MapPickerProps> = ({ location, onLocationSelect, markers = [] }) => {
  const initialLat = location?.lat ?? 37.7749;
  const initialLng = location?.lng ?? -122.4194;
  const webviewRef = useRef<WebView>(null);
  const [searchInput, setSearchInput] = useState("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css"/>
      <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
      <style> html, body, #map { height: 100%; margin: 0; padding: 0; } </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map').setView([${initialLat}, ${initialLng}], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
        var marker = L.marker([${initialLat}, ${initialLng}]).addTo(map);

        map.on('click', function(e) {
          var coords = e.latlng;
          marker.setLatLng(coords);
          window.ReactNativeWebView.postMessage(JSON.stringify(coords));
        });

        function flyTo(lat, lng) {
          marker.setLatLng([lat, lng]);
          map.flyTo([lat, lng], 13);
        }

        window.addEventListener('message', function(event) {
          try {
            const data = JSON.parse(event.data);
            if (data.lat && data.lng) flyTo(data.lat, data.lng);
          } catch(e) {
            console.error(e);
          }
        });
      </script>
    </body>
    </html>
  `;

  // Fly to new location when `location` prop changes
  useEffect(() => {
    if (location?.lat && location?.lng) {
      webviewRef.current?.postMessage(JSON.stringify({ lat: location.lat, lng: location.lng }));
    }
  }, [location]);

  // Handle search input: geocode address and fly marker
  const handleSearch = async () => {
    if (!searchInput.trim()) return Alert.alert("Error", "Please type a location");

    try {
      const geocode = await Location.geocodeAsync(searchInput);
      if (geocode.length > 0) {
        const { latitude, longitude } = geocode[0];
        // Send coordinates to WebView
        webviewRef.current?.postMessage(JSON.stringify({ lat: latitude, lng: longitude }));
        // Update parent component
        onLocationSelect(latitude, longitude);
      } else {
        Alert.alert("Not found", "Location not found");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to locate address");
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search location"
          value={searchInput}
          onChangeText={setSearchInput}
          style={styles.input}
        />
        <TouchableOpacity onPress={handleSearch} style={styles.button}>
          <Text style={{ color: "#fff", fontWeight: "600" }}>Go</Text>
        </TouchableOpacity>
      </View>

      {/* Map */}
      <WebView
        ref={webviewRef}
        originWhitelist={["*"]}
        source={{ html }}
        style={{ flex: 1 }}
        onMessage={(event) => {
          const coords = JSON.parse(event.nativeEvent.data);
          onLocationSelect(coords.lat, coords.lng);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: "row",
    padding: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#D1D5DB",
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    marginRight: 8,
  },
  button: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default MapPickerMobile;
