"use client";
import { useLoader } from "@/context/LoaderContext";
import { createItem, getAllItemData, getItemById, updateItem } from "@/services/itemService";
import { sendNotification } from "@/services/loactionnotificationService";
import { findMatchingItem } from "@/services/matchService";
import { addNotification } from "@/services/notifyNotificationService";
import { Item } from "@/types/item";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import dynamic from "next/dynamic";
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

const MapPicker = dynamic(() => import("@/components/MapPicker"), { ssr: false });

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
  const [contactInfo, setContactInfo] = useState<string>("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [nearbyItems, setNearbyItems] = useState<Item[]>([]);

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
          setLocation(
            item.location &&
              typeof item.location.lat === "number" &&
              typeof item.location.lng === "number"
              ? { lat: item.location.lat, lng: item.location.lng }
              : null
          );
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

  // Handle nearby marker click
  const handleNearbyMarkerClick = (marker: { lat: number; lng: number; id?: string }) => {
    const item = nearbyItems.find(
      (i) =>
        (marker.id && i.id === marker.id) ||
        (i.location?.lat === marker.lat && i.location?.lng === marker.lng)
    );
    if (!item) return;

    setTitle(item.title);
    setDescription(item.description || "");
    setStatus(item.status);
    setCategory(item.category || "");
    setContactInfo(item.contactInfo || "");
    setImageUri(item.photoURL || null);
    setLocation(
      item.location &&
        typeof item.location.lat === "number" &&
        typeof item.location.lng === "number"
        ? { lat: item.location.lat, lng: item.location.lng }
        : null
    );
  };

  // Submit form
  const handleSubmit = async () => {
    if (!title.trim()) return Alert.alert("Validation", "Title is required");
    if (!category) return Alert.alert("Validation", "Please select a category");
    if (!location) return Alert.alert("Validation", "Please select a location on the map");
    if (!currentUser) return Alert.alert("Error", "You must be logged in to add or edit items");

    const itemData: Item = {
      title: title.trim(),
      description: description.trim(),
      status,
      category,
      location,
      contactInfo: contactInfo.trim() || undefined,
      photoURL: imageUri || undefined,
      userId: currentUser.uid,
      createdAt: new Date(),
    };

    try {
      showLoader();

      const allItems = await getAllItemData();
      const newItemId = await createItem(itemData);

      // Nearby users (~5km)
      const nearby = allItems.filter(
        (i) =>
          i.userId !== currentUser.uid &&
          i.location &&
          typeof i.location.lat === "number" &&
          typeof i.location.lng === "number" &&
          Math.abs(i.location.lat - location.lat) < 0.05 &&
          Math.abs(i.location.lng - location.lng) < 0.05
      );
      setNearbyItems(nearby);

      // Notify nearby users
      await Promise.all(
        nearby.map((i) =>
          sendNotification(
            i.userId!,
            newItemId,
            `Nearby ${status} item!`,
            `A ${category} titled "${title}" is near your location.`
          )
        )
      );

      // Check for exact match
      const match = findMatchingItem(itemData, allItems);
      if (match?.id && match.userId) {
        await updateItem(newItemId, { ...itemData, matchedItemId: match.id, id: undefined });
        await updateItem(match.id, { ...match, matchedItemId: newItemId, id: undefined });

        // Notify matched user
        await addNotification({
          toUserId: match.userId,
          fromUserId: currentUser.uid,
          title: "Match Found!",
          message: `Your ${match.status} item "${match.title}" matches a ${status} item nearby.`,
          type: "match",
          itemId: match.id,
          matchedItemId: newItemId,
        });

        // Notify current user
        await addNotification({
          toUserId: currentUser.uid,
          fromUserId: match.userId,
          title: "Match Found!",
          message: `Your ${status} item "${title}" matches a ${match.status} item nearby.`,
          type: "match",
          itemId: newItemId,
          matchedItemId: match.id,
        });

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
      <View className="flex-row justify-between items-center px-5 py-4 bg-white shadow">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#3B82F6" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-gray-900">{isNew ? "Add Item" : "Edit Item"}</Text>
        <View className="w-8" />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          {/* Lost / Found */}
          <View className="flex-row mb-4 bg-gray-200 rounded-xl overflow-hidden">
            {(["Lost", "Found"] as const).map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => setStatus(s)}
                className={`flex-1 py-3 rounded-xl ${status === s ? (s === "Lost" ? "bg-blue-500" : "bg-green-500") : ""}`}
              >
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

          {/* Title & Description */}
          <TextInput className="bg-white border border-gray-300 p-3 rounded-xl mb-4 shadow-sm" placeholder="Enter title" value={title} onChangeText={setTitle} />
          <TextInput className="bg-white border border-gray-300 p-3 rounded-xl mb-4 shadow-sm" placeholder="Enter description" value={description} onChangeText={setDescription} multiline numberOfLines={4} />

          {/* Category */}
          <View className="flex-row flex-wrap mb-4">
            {categories.map((cat) => (
              <TouchableOpacity key={cat.id} onPress={() => setCategory(cat.name)} className={`px-4 py-2 mr-2 mb-2 rounded-2xl border border-gray-300 shadow ${category === cat.name ? "bg-blue-500" : "bg-white"}`}>
                <Text className={`font-semibold ${category === cat.name ? "text-white" : "text-gray-700"}`}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Map Picker */}
          <MapPicker
            onLocationSelect={(lat, lng) => setLocation({ lat, lng })}
            markers={nearbyItems
              .filter(
                (item): item is Item & { location: { lat: number; lng: number } } => !!item.location && !!item.id && typeof item.location.lat === "number" && typeof item.location.lng === "number"
              )
              .map((item) => ({
                id: item.id,
                lat: item.location.lat,
                lng: item.location.lng,
                title: item.title,
                status: item.status,
                photoURL: item.photoURL || null,
              }))}
            location={location || undefined}
            zoom={10}
          />
          {location && <Text className="text-gray-500 mt-1">Selected: Lat {location.lat.toFixed(4)}, Lng {location.lng.toFixed(4)}</Text>}

          {/* Contact Info */}
          <TextInput className="bg-white border border-gray-300 p-3 rounded-xl mb-6 shadow-sm" placeholder="Enter contact info" value={contactInfo} onChangeText={setContactInfo} />

          {/* Submit */}
          <TouchableOpacity className="bg-blue-500 rounded-2xl py-4 items-center justify-center shadow-lg" onPress={handleSubmit}>
            <Text className="text-white font-bold text-lg">{isNew ? "Add Item" : "Update Item"}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default FoundlyItemFormScreen;
