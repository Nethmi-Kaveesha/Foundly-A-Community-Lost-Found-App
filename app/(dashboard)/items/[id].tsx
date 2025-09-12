// app/(dashboard)/items/[id].tsx
"use client";

import { useLoader } from "@/context/LoaderContext";
import { createItem, getAllItemData, getItemById, updateItem } from "@/services/itemService";
import { findMatchingItem } from "@/services/matchService";
import { sendMatchNotification } from "@/services/notificationService";
import { Item } from "@/types/item";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Import the MapPicker
import dynamic from "next/dynamic";
const MapPicker = dynamic(() => import("@/components/MapPicker"), { ssr: false });

// Categories
const categories = [
  { id: "1", name: "Pets" },
  { id: "2", name: "Electronics" },
  { id: "3", name: "Bags" },
  { id: "4", name: "Keys" },
];

const FoundlyItemFormScreen = () => {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isNew = !id || id === "new";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"Lost" | "Found">("Lost");
  const [category, setCategory] = useState<string>("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState("");
  const [contactInfo, setContactInfo] = useState<string>("");
  const [imageUri, setImageUri] = useState<string | null>(null);

  const router = useRouter();
  const { showLoader, hideLoader } = useLoader();
  const auth = getAuth();
  const currentUser = auth.currentUser;

  // Load existing item if editing
  useEffect(() => {
    const loadItem = async () => {
      if (!isNew && id) {
        try {
          showLoader();
          const item = await getItemById(id);
          if (!item) {
            Alert.alert("Not found", "Item not found");
            router.replace("/(dashboard)/items");
            return;
          }
          if (item.userId !== currentUser?.uid) {
            Alert.alert("Unauthorized", "You cannot edit this item.");
            router.replace("/(dashboard)/items");
            return;
          }
          setTitle(item.title);
          setDescription(item.description);
          setStatus(item.status);
          setCategory(item.category);
          if (item.location?.lat && item.location?.lng) {
            setLocation({ lat: item.location.lat, lng: item.location.lng });
          }
          setLocationName(item.location?.address || "");
          setContactInfo(item.contactInfo || "");
          setImageUri(item.photoURL || null);
        } catch (err) {
          console.error(err);
          Alert.alert("Error", "Failed to load item.");
        } finally {
          hideLoader();
        }
      }
    };
    loadItem();
  }, [id, currentUser]);

  // Pick image from gallery
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  // Geocode typed location using OpenStreetMap Nominatim
  const handleSetLocationFromName = async () => {
    if (!locationName.trim()) return;

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setLocation({ lat: parseFloat(lat), lng: parseFloat(lon) });
      } else {
        Alert.alert("Not Found", "Could not find the location");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to fetch location");
    }
  };

  // Submit form
  const handleSubmit = async () => {
    if (!title.trim()) { Alert.alert("Validation", "Title is required"); return; }
    if (!category) { Alert.alert("Validation", "Please select a category"); return; }
    if (!currentUser) { Alert.alert("Error", "You must be logged in"); return; }
    if (!location) { Alert.alert("Validation", "Please select a location"); return; }

    const itemData: Item = {
      title: title.trim(),
      description: description.trim(),
      status,
      category,
      location: { ...location, address: locationName.trim() || undefined },
      contactInfo: contactInfo.trim() || undefined,
      photoURL: imageUri || undefined,
      userId: currentUser.uid,
    };

    try {
      showLoader();

      // Check for matches
      const allItems = await getAllItemData();
      const match = findMatchingItem(itemData, allItems);

      const newItemId = await createItem(itemData);

      if (match?.id) {
        await updateItem(newItemId, { ...itemData, matchedItemId: match.id, id: undefined });
        const updatedMatch: Item = { ...match, matchedItemId: newItemId, id: undefined };
        await updateItem(match.id, updatedMatch);
        await sendMatchNotification(match, { ...itemData, id: newItemId });
        Alert.alert("Match Found!", "This item matches with an existing item.");
      }

      router.replace("/(dashboard)/items");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to save item");
    } finally {
      hideLoader();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="flex-row justify-between items-center px-5 py-4 bg-white shadow">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#3B82F6" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-gray-900">{isNew ? "Add Item" : "Edit Item"}</Text>
        <View className="w-8" />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">

          {/* Lost / Found Toggle */}
          <View className="flex-row mb-4 bg-gray-200 rounded-xl overflow-hidden">
            {(["Lost", "Found"] as const).map((s) => (
              <TouchableOpacity key={s} onPress={() => setStatus(s)}
                className={`flex-1 py-3 rounded-xl ${status === s ? (s === "Lost" ? "bg-blue-500" : "bg-green-500") : ""}`}>
                <Text className={`text-center font-semibold ${status === s ? "text-white" : "text-gray-700"}`}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Image Picker */}
          <Text className="text-gray-700 text-lg font-semibold mb-2">Photo</Text>
          <TouchableOpacity onPress={pickImage} className="bg-white border border-gray-300 rounded-xl mb-4 items-center justify-center" style={{ height: 180 }}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={{ width: "100%", height: "100%", borderRadius: 12 }} resizeMode="cover" />
            ) : (
              <View className="items-center justify-center flex-1">
                <Ionicons name="image-outline" size={40} color="#9CA3AF" />
                <Text className="text-gray-400 mt-2">Tap to select image</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Title */}
          <Text className="text-gray-700 text-lg font-semibold mb-2">Title</Text>
          <TextInput className="bg-white border border-gray-300 p-3 rounded-xl mb-4 shadow-sm" placeholder="Enter title" value={title} onChangeText={setTitle} />

          {/* Description */}
          <Text className="text-gray-700 text-lg font-semibold mb-2">Description</Text>
          <TextInput className="bg-white border border-gray-300 p-3 rounded-xl mb-4 shadow-sm" placeholder="Enter description" value={description} onChangeText={setDescription} multiline numberOfLines={4} />

          {/* Category */}
          <Text className="text-gray-700 text-lg font-semibold mb-2">Category</Text>
          <View className="flex-row flex-wrap mb-4">
            {categories.map((cat) => (
              <TouchableOpacity key={cat.id} onPress={() => setCategory(cat.name)}
                className={`px-4 py-2 mr-2 mb-2 rounded-2xl border border-gray-300 shadow ${category === cat.name ? "bg-blue-500" : "bg-white"}`}>
                <Text className={`font-semibold ${category === cat.name ? "text-white" : "text-gray-700"}`}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Location Name */}
          <Text className="text-gray-700 text-lg font-semibold mb-2">Location Name / Address</Text>
          <TextInput
            className="bg-white border border-gray-300 p-3 rounded-xl mb-2 shadow-sm"
            placeholder="Enter location name or address"
            value={locationName}
            onChangeText={setLocationName}
          />
          <TouchableOpacity className="bg-blue-500 rounded-xl py-2 px-4 mb-4" onPress={handleSetLocationFromName}>
            <Text className="text-white font-semibold text-center">Set on Map</Text>
          </TouchableOpacity>

          {/* Map Picker */}
          <MapPicker location={location || undefined} onLocationSelect={(lat, lng) => setLocation({ lat, lng })} />
          {location && (
            <Text className="text-gray-500 mt-1">
              Selected: Lat {location.lat.toFixed(4)}, Lng {location.lng.toFixed(4)}
            </Text>
          )}

          {/* Contact Info */}
          <Text className="text-gray-700 text-lg font-semibold mb-2">Contact Info</Text>
          <TextInput className="bg-white border border-gray-300 p-3 rounded-xl mb-6 shadow-sm" placeholder="Enter contact info" value={contactInfo} onChangeText={setContactInfo} />

          {/* Submit Button */}
          <TouchableOpacity className="bg-blue-500 rounded-2xl py-4 items-center justify-center shadow-lg" onPress={handleSubmit}>
            <Text className="text-white font-bold text-lg">{isNew ? "Add Item" : "Update Item"}</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default FoundlyItemFormScreen;
