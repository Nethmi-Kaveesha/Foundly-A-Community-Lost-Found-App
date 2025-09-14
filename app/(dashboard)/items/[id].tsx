"use client";

import type { MarkerType } from "@/components/MapPicker.types";
import { createItem, itemColRef } from "@/services/itemService";
import type { Item, ItemLocation } from "@/types/item";
import * as ImagePicker from "expo-image-picker";
import { getAuth } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import dynamic from "next/dynamic";
import React, { useState } from "react";
import { Alert, Image, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Dynamically import map picker
const MapPicker = dynamic(
  () =>
    Platform.OS === "web"
      ? import("@/components/MapPickerWeb")
      : import("@/components/MapPickerMobile"),
  { ssr: false }
);

// Categories list
const categoriesList = [
  { id: "1", name: "Pets" },
  { id: "2", name: "Electronics" },
  { id: "3", name: "Bags" },
  { id: "4", name: "Keys" },
];

// Validate location
const getValidLocation = (loc?: ItemLocation) =>
  loc?.lat !== undefined && loc?.lng !== undefined
    ? { lat: loc.lat, lng: loc.lng }
    : undefined;

interface FoundlyItemFormScreenProps {
  item?: Item; // Optional for edit
  onSave?: () => void; // Callback after save
}

const FoundlyItemFormScreen: React.FC<FoundlyItemFormScreenProps> = ({ item, onSave }) => {
  const [title, setTitle] = useState(item?.title || "");
  const [description, setDescription] = useState(item?.description || "");
  const [status, setStatus] = useState<"Lost" | "Found">(item?.status || "Lost");
  const [category, setCategory] = useState(item?.category || "");
  const [contact, setContact] = useState(item?.contactInfo || "");
  const [imageUri, setImageUri] = useState<string | null>(item?.photoURL || null);
  const [itemLocation, setItemLocation] = useState<ItemLocation>(item?.location || {});

  const auth = getAuth();
  const currentUser = auth.currentUser;

  // Pick image
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

  // Submit form
  const handleSubmit = async () => {
    if (!title.trim()) return Alert.alert("Validation", "Title is required");
    if (!category) return Alert.alert("Validation", "Select a category");
    if (!contact.trim()) return Alert.alert("Validation", "Enter contact number");
    if (!getValidLocation(itemLocation)) return Alert.alert("Validation", "Select a location on the map");
    if (!currentUser) return Alert.alert("Error", "You must be logged in");

    try {
      const newItem: Item = {
        title,
        description,
        status,
        category,
        contactInfo: contact,
        photoURL: imageUri || undefined,
        location: itemLocation,
        userId: currentUser.uid,
        id: item?.id,
      };

      if (item) {
        // Update existing item
        await updateDoc(doc(itemColRef, item.id!), {
          title: newItem.title,
          description: newItem.description,
          status: newItem.status,
          category: newItem.category,
          contactInfo: newItem.contactInfo,
          photoURL: newItem.photoURL,
          location: newItem.location,
        });
        Alert.alert("Success", "Item updated!");
      } else {
        // Create new item
        await createItem(newItem);
        Alert.alert("Success", "Item posted successfully!");
      }

      // Reset form if creating new
      if (!item) {
        setTitle(""); setDescription(""); setStatus("Lost"); setCategory(""); setContact(""); setImageUri(null); setItemLocation({});
      }

      onSave?.();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to save item");
      console.error(err);
    }
  };

  const validLocation = getValidLocation(itemLocation);
  const markers: MarkerType[] = validLocation ? [{ id: "selected", lat: validLocation.lat, lng: validLocation.lng }] : [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F3F4F6" }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        
        {/* Lost/Found toggle */}
        <View style={{ flexDirection: "row", marginBottom: 16 }}>
          {(["Lost", "Found"] as const).map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setStatus(s)}
              style={{
                flex: 1,
                paddingVertical: 12,
                backgroundColor: status === s ? (s === "Lost" ? "#3B82F6" : "#10B981") : "#E5E7EB",
                borderRadius: 12,
                marginHorizontal: 4,
              }}
            >
              <Text style={{ textAlign: "center", color: status === s ? "#fff" : "#374151", fontWeight: "600" }}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Image picker */}
        <TouchableOpacity
          onPress={pickImage}
          style={{
            height: 180,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#D1D5DB",
            marginBottom: 16,
            overflow: "hidden",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={{ width: "100%", height: "100%" }} />
          ) : (
            <View style={{ justifyContent: "center", alignItems: "center" }}>
              <Text style={{ color: "#9CA3AF" }}>Tap to select image</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Title, Description, Contact */}
        <TextInput
          placeholder="Title"
          value={title}
          onChangeText={setTitle}
          style={{ backgroundColor: "#fff", padding: 12, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: "#D1D5DB" }}
        />
        <TextInput
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          style={{ backgroundColor: "#fff", padding: 12, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: "#D1D5DB" }}
        />
        <TextInput
          placeholder="Contact Number"
          value={contact}
          onChangeText={setContact}
          keyboardType="phone-pad"
          style={{ backgroundColor: "#fff", padding: 12, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: "#D1D5DB" }}
        />

        {/* Categories */}
        <ScrollView horizontal style={{ marginBottom: 12 }}>
          {categoriesList.map((cat) => (
            <TouchableOpacity key={cat.id} onPress={() => setCategory(cat.name)}
              style={{ paddingHorizontal: 16, paddingVertical: 8, marginRight: 8, borderRadius: 24, backgroundColor: category === cat.name ? "#3B82F6" : "#fff", borderWidth: 1, borderColor: "#D1D5DB" }}>
              <Text style={{ color: category === cat.name ? "#fff" : "#374151", fontWeight: "600" }}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Map */}
        <View style={{ height: 300, borderRadius: 12, overflow: "hidden", marginBottom: 12 }}>
          <MapPicker
            location={validLocation}
            onLocationSelect={(lat, lng) => setItemLocation({ lat, lng })}
            markers={markers}
          />
        </View>

        {/* Selected coordinates */}
        {validLocation && (
          <Text style={{ color: "#6B7280", marginBottom: 12 }}>
            Selected Location: Lat {itemLocation.lat?.toFixed(4)}, Lng {itemLocation.lng?.toFixed(4)}
          </Text>
        )}

        {/* Submit */}
        <TouchableOpacity onPress={handleSubmit} style={{ backgroundColor: "#3B82F6", paddingVertical: 16, borderRadius: 24, alignItems: "center" }}>
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>{item ? "Update Item" : "Submit"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default FoundlyItemFormScreen;
