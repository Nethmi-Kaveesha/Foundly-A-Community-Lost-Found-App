import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { WebView } from "react-native-webview";
import type { MapPickerProps, MarkerType } from "./MapPicker.types";

const MapPickerMobile: React.FC<MapPickerProps> = ({ location, markers = [], onLocationSelect }) => {
  const webviewRef = useRef<WebView>(null);
  const [searchInput, setSearchInput] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Reverse geocode helper
  const fillAddress = async (lat: number, lng: number) => {
    try {
      const [address] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (address) {
        const formatted = [
          address.name,
          address.street,
          address.city,
          address.region,
          address.postalCode,
          address.country,
        ].filter(Boolean).join(", ");
        setSearchInput(formatted);
      }
    } catch (err) {
      console.warn("Reverse geocode failed", err);
    }
  };

  // Initialize coordinates
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission denied", "Location permission is required.");
          return;
        }

        let lat: number, lng: number;

        if (location?.lat != null && location?.lng != null) {
          lat = location.lat;
          lng = location.lng;
        } else {
          const current = await Location.getCurrentPositionAsync({});
          lat = current.coords.latitude;
          lng = current.coords.longitude;
        }

        setCoords({ lat, lng });
        await fillAddress(lat, lng);
        onLocationSelect(lat, lng);

        setTimeout(() => {
          webviewRef.current?.postMessage(JSON.stringify({ lat, lng }));
        }, 500);
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Failed to get location");
      }
    })();
  }, [location]);

  if (!coords) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading map...</Text>
      </View>
    );
  }

  // Handle map clicks
  const handleMapClick = async (event: any) => {
    const data = JSON.parse(event.nativeEvent.data);
    if (data.lat && data.lng) {
      setCoords({ lat: data.lat, lng: data.lng });
      await fillAddress(data.lat, data.lng);
      onLocationSelect(data.lat, data.lng);
    }
  };

  // Handle address search
  const handleSearch = async () => {
    if (!searchInput.trim()) return Alert.alert("Error", "Please type a location");

    try {
      const geocode = await Location.geocodeAsync(searchInput);
      if (geocode.length > 0) {
        const { latitude, longitude } = geocode[0];
        setCoords({ lat: latitude, lng: longitude });
        webviewRef.current?.postMessage(JSON.stringify({ lat: latitude, lng: longitude }));
        await fillAddress(latitude, longitude);
        onLocationSelect(latitude, longitude);
      } else {
        Alert.alert("Not found", "Location not found");
      }
    } catch {
      Alert.alert("Error", "Failed to locate address");
    }
  };

  // Prepare all markers: selected + extra markers
  const allMarkers: MarkerType[] = [
    ...(coords ? [{ id: "selected", lat: coords.lat, lng: coords.lng }] : []),
    ...markers,
  ];

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css"/>
      <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
      <style>html, body, #map { height: 100%; margin: 0; padding: 0; }</style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map').setView([${coords.lat}, ${coords.lng}], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

        var markers = {};

        // Add initial markers
        ${allMarkers.map(m => `
          markers["${m.id}"] = L.marker([${m.lat}, ${m.lng}]).addTo(map)${m.title ? `.bindPopup("${m.title}")` : ""};
        `).join("")}

        // Handle map click
        map.on('click', function(e) {
          var coords = e.latlng;
          if(markers["selected"]) {
            markers["selected"].setLatLng(coords);
          } else {
            markers["selected"] = L.marker([coords.lat, coords.lng]).addTo(map);
          }
          window.ReactNativeWebView.postMessage(JSON.stringify(coords));
        });

        function flyTo(lat, lng) {
          if(markers["selected"]) {
            markers["selected"].setLatLng([lat, lng]);
          } else {
            markers["selected"] = L.marker([lat, lng]).addTo(map);
          }
          map.flyTo([lat, lng], 13);
        }

        window.addEventListener('message', function(event) {
          try {
            const data = JSON.parse(event.data);
            if (data.lat && data.lng) flyTo(data.lat, data.lng);
          } catch(e) { console.error(e); }
        });
      </script>
    </body>
    </html>
  `;

  return (
    <View style={{ flex: 1 }}>
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

      <WebView
        ref={webviewRef}
        originWhitelist={["*"]}
        source={{ html }}
        style={{ flex: 1 }}
        onMessage={handleMapClick}
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
