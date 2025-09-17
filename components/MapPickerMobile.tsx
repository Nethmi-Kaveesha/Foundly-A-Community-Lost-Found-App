import { db } from "@/firebase";
import type { Item } from "@/types/item";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { collection, getDocs } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { WebView } from "react-native-webview";
import type { MapPickerProps } from "./MapPicker.types";

const palette = {
  dark: "#222831",
  darker: "#393E46",
  accent: "#00ADB5",
  light: "#EEEEEE",
};

const MapPickerMobile: React.FC<MapPickerProps> = ({
  location,
  onLocationSelect,
  markers = [],
  onAddressChange,
}) => {
  const initialLat = location?.lat ?? 37.7749;
  const initialLng = location?.lng ?? -122.4194;
  const webviewRef = useRef<WebView>(null);
  const [searchInput, setSearchInput] = useState("");

  const fillAddress = async (lat: number, lng: number) => {
    try {
      const geocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (geocode.length > 0) {
        const addr = `${geocode[0].name ?? ""}, ${geocode[0].city ?? ""}, ${geocode[0].region ?? ""}`;
        setSearchInput(addr);
        if (onAddressChange) onAddressChange(addr);
      }
    } catch (err) {
      console.warn("Reverse geocode failed:", err);
    }
  };

  useEffect(() => {
    if (location?.lat && location?.lng) {
      webviewRef.current?.postMessage(JSON.stringify({ type: "flyTo", lat: location.lat, lng: location.lng }));
      fillAddress(location.lat, location.lng);
    }
  }, [location]);

  const fetchNearbyItems = async (lat: number, lng: number, radiusKm = 5) => {
    const itemsCol = collection(db, "items");
    const snap = await getDocs(itemsCol);
    const items: any[] = [];
    snap.forEach(doc => {
      const data = doc.data() as Item;
      if (data.location?.lat && data.location?.lng) {
        const distance = getDistanceKm(lat, lng, data.location.lat, data.location.lng);
        if (distance <= radiusKm) {
          items.push({
            id: data.id,
            lat: data.location.lat,
            lng: data.location.lng,
            title: data.title,
            category: data.category,
            status: data.status,
          });
        }
      }
    });
    return items;
  };

  const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const handleSearch = async () => {
    if (!searchInput.trim()) return Alert.alert("Error", "Please type a location");
    try {
      const geocode = await Location.geocodeAsync(searchInput);
      if (geocode.length > 0) {
        const { latitude, longitude } = geocode[0];
        webviewRef.current?.postMessage(JSON.stringify({ type: "flyTo", lat: latitude, lng: longitude }));
        onLocationSelect(latitude, longitude);
        fillAddress(latitude, longitude);

        const nearbyItems = await fetchNearbyItems(latitude, longitude);
        webviewRef.current?.postMessage(JSON.stringify({ type: "markers", items: nearbyItems }));
      } else {
        Alert.alert("Not found", "Location not found");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to locate address");
    }
  };

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
        var mainMarker = L.marker([${initialLat}, ${initialLng}]).addTo(map);
        var itemMarkers = [];

        function renderMarkers(items) {
          itemMarkers.forEach(m => map.removeLayer(m));
          itemMarkers = [];
          items.forEach(item => {
            var m = L.marker([item.lat, item.lng]).addTo(map);
            m.bindPopup(
              '<b>' + item.title + '</b><br>Status: ' + item.status + '<br>Category: ' + item.category
            );
            itemMarkers.push(m);
          });
        }

        function flyTo(lat, lng) {
          mainMarker.setLatLng([lat, lng]);
          map.flyTo([lat, lng], 13);
        }

        map.on('click', function(e) {
          var coords = e.latlng;
          mainMarker.setLatLng(coords);
          window.ReactNativeWebView.postMessage(JSON.stringify({ lat: coords.lat, lng: coords.lng }));
        });

        window.addEventListener('message', function(event) {
          try {
            const data = JSON.parse(event.data);
            if(data.type === "flyTo") flyTo(data.lat, data.lng);
            if(data.type === "markers") renderMarkers(data.items);
          } catch(e) { console.error(e); }
        });
      </script>
    </body>
    </html>
  `;

  return (
    <LinearGradient colors={[palette.dark, palette.darker]} style={{ flex: 1 }}>
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search location"
          placeholderTextColor={palette.light}
          value={searchInput}
          onChangeText={setSearchInput}
          style={styles.input}
        />
        <TouchableOpacity onPress={handleSearch} style={styles.button}>
          <Text style={{ color: palette.light, fontWeight: "600" }}>Go</Text>
        </TouchableOpacity>
      </View>

      <WebView
        ref={webviewRef}
        originWhitelist={["*"]}
        source={{ html }}
        style={{ flex: 1, backgroundColor: palette.darker }}
        onMessage={(event) => {
          const coords = JSON.parse(event.nativeEvent.data);
          if(coords.lat && coords.lng) {
            onLocationSelect(coords.lat, coords.lng);
            fillAddress(coords.lat, coords.lng);
          }
        }}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: "row",
    padding: 8,
    backgroundColor: "rgba(57,62,70,0.9)",
    borderBottomWidth: 1,
    borderColor: "#222831",
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#00ADB5",
    borderRadius: 12,
    marginRight: 8,
    color: "#EEEEEE",
    backgroundColor: "#393E46",
  },
  button: {
    backgroundColor: "#00ADB5",
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default MapPickerMobile;
