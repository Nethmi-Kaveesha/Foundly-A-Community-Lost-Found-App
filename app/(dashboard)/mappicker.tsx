"use client";

import { db } from "@/firebase";
import type { Item, ItemLocation } from "@/types/item";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import dynamic from "next/dynamic";
import React, { useEffect, useState } from "react";
import {
  Image,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

// Dynamic MapPicker import
const MapPicker = dynamic(
  () =>
    Platform.OS === "web"
      ? import("@/components/MapPickerWeb")
      : import("@/components/MapPickerMobile"),
  { ssr: false }
);

// Theme Palette
const palette = {
  dark: "#222831",
  darker: "#393E46",
  accent: "#00ADB5",
  light: "#EEEEEE",
};

// Helpers
const getValidLocation = (loc?: ItemLocation) =>
  loc?.lat !== undefined && loc?.lng !== undefined
    ? { lat: loc.lat, lng: loc.lng }
    : undefined;

// Haversine formula to calculate distance in km
const getDistanceKm = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const FoundlyMapScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isEditMode = !!id && id !== "new";
  const router = useRouter();

  const [itemLocation, setItemLocation] = useState<ItemLocation>({});
  const [nearbyItems, setNearbyItems] = useState<Item[]>([]);
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  const auth = getAuth();
  const currentUser = auth.currentUser;

  // Fetch a specific item if editing
  useEffect(() => {
    if (!isEditMode || !id) return;

    const fetchItem = async () => {
      try {
        const docRef = doc(db, "items", id);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          const data = snap.data() as Item;
          if (data.location?.lat != null && data.location?.lng != null) {
            setItemLocation({ lat: data.location.lat, lng: data.location.lng });
            fetchNearbyItems(data.location.lat, data.location.lng);
          }
        } else {
          Toast.show({ type: "error", text1: "Item not found" });
        }
      } catch (err) {
        console.error("Failed to fetch item:", err);
        Toast.show({ type: "error", text1: "Failed to fetch item" });
      }
    };

    fetchItem();
  }, [id]);

  // Fetch all items and filter by distance (within 5 km)
  const fetchNearbyItems = async (lat: number, lng: number) => {
    try {
      const snap = await getDocs(collection(db, "items"));
      const items: Item[] = [];
      snap.forEach((doc) => {
        const data = doc.data() as Item;
        if (data.location?.lat != null && data.location?.lng != null) {
          const distance = getDistanceKm(lat, lng, data.location.lat, data.location.lng);
          if (distance <= 5) items.push({ ...data, id: doc.id });
        }
      });
      setNearbyItems(items);
    } catch (err) {
      console.error("Failed to fetch nearby items:", err);
      Toast.show({ type: "error", text1: "Failed to fetch nearby items" });
    }
  };

  const validLocation = getValidLocation(itemLocation);

  // Prepare markers for map
  const markers = [
    ...(validLocation
      ? [{ id: "selected", lat: validLocation.lat, lng: validLocation.lng, title: "Your Location" }]
      : []),
    ...nearbyItems.map((item) => ({
      id: item.id!,
      lat: item.location!.lat!,
      lng: item.location!.lng!,
      title: `${item.title} (${item.status})`,
      item,
    })),
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.dark }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Map */}
        {Platform.OS === "web" ? (
          <div
            style={{
              height: 400,
              borderRadius: 12,
              overflow: "hidden",
              marginBottom: 12,
              border: `1px solid ${palette.darker}`,
            }}
          >
            <MapPicker
              location={validLocation}
              onLocationSelect={(lat, lng) => {
                setItemLocation({ lat, lng });
                fetchNearbyItems(lat, lng);
              }}
              markers={markers}
              onMarkerPress={(item) => alert(`${item.title} - ${item.status}`)}
            />
          </div>
        ) : (
          <View
            style={{
              height: 400,
              borderRadius: 12,
              overflow: "hidden",
              marginBottom: 12,
              borderWidth: 1,
              borderColor: palette.darker,
            }}
          >
            <MapPicker
              location={validLocation}
              onLocationSelect={(lat, lng) => {
                setItemLocation({ lat, lng });
                fetchNearbyItems(lat, lng);
              }}
              markers={markers}
              onMarkerPress={(item) => alert(`${item.title} - ${item.status}`)}
            />
          </View>
        )}

        {/* Selected Location */}
        {validLocation && (
          <Text style={{ color: palette.light, marginBottom: 16 }}>
            📍 Lat {itemLocation.lat?.toFixed(4)}, Lng {itemLocation.lng?.toFixed(4)}
          </Text>
        )}

        {/* Nearby Items */}
        {nearbyItems.length > 0 && (
          <View style={{ marginTop: 12 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                marginBottom: 12,
                color: palette.accent,
              }}
            >
              Nearby Items
            </Text>
            {nearbyItems.map((item) => (
              <View
                key={item.id}
                style={{
                  flexDirection: "row",
                  backgroundColor: palette.darker,
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 12,
                  shadowColor: "#000",
                  shadowOpacity: 0.3,
                  shadowRadius: 6,
                  shadowOffset: { width: 0, height: 3 },
                  elevation: 4,
                }}
              >
                {item.photoURL ? (
                  <Image
                    source={{ uri: item.photoURL }}
                    style={{ width: 70, height: 70, borderRadius: 8, marginRight: 12 }}
                  />
                ) : (
                  <View
                    style={{
                      width: 70,
                      height: 70,
                      borderRadius: 8,
                      marginRight: 12,
                      backgroundColor: palette.dark,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: palette.light }}>No Img</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ color: palette.light, fontWeight: "bold", marginBottom: 4 }}>
                    {item.title}
                  </Text>
                  <Text style={{ color: palette.light, marginBottom: 4 }}>
                    {item.description || "No description"}
                  </Text>
                  <Text style={{ color: palette.accent, fontSize: 12 }}>
                    {item.status} • {item.category}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <Toast />

        {/* Success Modal */}
        <Modal
          visible={successModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setSuccessModalVisible(false)}
        >
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(0,0,0,0.5)",
            }}
          >
            <View
              style={{
                width: 300,
                backgroundColor: palette.darker,
                padding: 20,
                borderRadius: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  marginBottom: 12,
                  color: palette.accent,
                }}
              >
                Success!
              </Text>
              <Text style={{ marginBottom: 20, color: palette.light }}>
                {isEditMode
                  ? "Location updated successfully."
                  : "Location saved successfully."}
              </Text>
              <TouchableOpacity
                onPress={() => setSuccessModalVisible(false)}
                style={{
                  backgroundColor: palette.accent,
                  padding: 12,
                  borderRadius: 8,
                }}
              >
                <Text
                  style={{
                    color: palette.light,
                    textAlign: "center",
                    fontWeight: "600",
                  }}
                >
                  OK
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

export default FoundlyMapScreen;
