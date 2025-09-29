import type { MarkerType } from "@/components/MapPicker.types";
import { db } from "@/firebase";
import { createItem } from "@/services/itemService";
import type { Item, ItemLocation } from "@/types/item";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import dynamic from "next/dynamic";
import React, { useEffect, useState } from "react";

import { Ionicons } from "@expo/vector-icons";
import {
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

// Map picker
const MapPicker = dynamic(
  () =>
    Platform.OS === "web"
      ? import("@/components/MapPickerWeb")
      : import("@/components/MapPickerMobile"),
  { ssr: false }
);

const categoriesList = [
  { id: "1", name: "Pets" },
  { id: "2", name: "Electronics" },
  { id: "3", name: "Bags" },
  { id: "4", name: "Keys" },
];

const palette = {
  dark: "#222831",
  darker: "#393E46",
  accent: "#00ADB5",
  light: "#EEEEEE",
};

const HEADER_HEIGHT = 60;

const getValidLocation = (loc?: ItemLocation) =>
  loc?.lat !== undefined && loc?.lng !== undefined
    ? { lat: loc.lat, lng: loc.lng }
    : undefined;

const FoundlyItemFormScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isEditMode = !!id && id !== "new";
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"Lost" | "Found">("Lost");
  const [category, setCategory] = useState("");
  const [contact, setContact] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [itemLocation, setItemLocation] = useState<ItemLocation>({});
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  const auth = getAuth();
  const currentUser = auth.currentUser;

  // fetch item if editing
  useEffect(() => {
    if (!isEditMode) return;
    const fetchItem = async () => {
      try {
        const docRef = doc(db, "items", id!);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data() as Item;
          setTitle(data.title || "");
          setDescription(data.description || "");
          setStatus(data.status || "Lost");
          setCategory(data.category || "");
          setContact(data.contactInfo || "");
          setImageUri(data.photoURL || null);
          if (data.location?.lat && data.location?.lng) {
            setItemLocation({ lat: data.location.lat, lng: data.location.lng });
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

  // Request camera permission
  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Toast.show({ type: "error", text1: "Camera permission is required" });
      return false;
    }
    return true;
  };

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

  const takePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleImagePicker = () => {
    Alert.alert(
      "Select Image",
      "Choose an option",
      [
        { text: "Camera", onPress: takePhoto },
        { text: "Gallery", onPress: pickImage },
        { text: "Cancel", style: "cancel" },
      ],
      { cancelable: true }
    );
  };

  const handleSubmit = async () => {
    if (!title.trim()) return Toast.show({ type: "error", text1: "Title is required" });
    if (!category) return Toast.show({ type: "error", text1: "Select a category" });
    if (!contact.trim()) return Toast.show({ type: "error", text1: "Enter contact number" });
    if (!getValidLocation(itemLocation))
      return Toast.show({ type: "error", text1: "Select a location on the map" });
    if (!currentUser) return Toast.show({ type: "error", text1: "You must be logged in" });

    try {
      const itemData: Partial<Item> = {
        title,
        description,
        status,
        category,
        contactInfo: contact,
        photoURL: imageUri || undefined,
        location: Object.keys(itemLocation).length ? itemLocation : undefined,
        userId: currentUser.uid,
      };

      if (isEditMode) {
        const cleanData = Object.fromEntries(
          Object.entries(itemData).filter(([_, v]) => v !== undefined && v !== null)
        );
        await updateDoc(doc(db, "items", id!), cleanData);
        Toast.show({ type: "success", text1: "Item updated successfully" });
      } else {
        await createItem(itemData as Item);
        Toast.show({ type: "success", text1: "Item saved successfully" });
        setTitle(""); setDescription(""); setStatus("Lost");
        setCategory(""); setContact(""); setImageUri(null); setItemLocation({});
      }

      setSuccessModalVisible(true);
    } catch (err: any) {
      console.error(err);
      Toast.show({
        type: "error",
        text1: "Failed to save item",
        text2: err.message || "Something went wrong",
      });
    }
  };

  const validLocation = getValidLocation(itemLocation);
  const markers: MarkerType[] = validLocation
    ? [{ id: "selected", lat: validLocation.lat, lng: validLocation.lng }]
    : [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.dark }}>
      {/* Custom Header */}
      <View
        style={{
          height: HEADER_HEIGHT,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          backgroundColor: palette.darker,
          borderBottomWidth: 1,
          borderBottomColor: "#111",
          zIndex: 10,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
          <Ionicons name="chevron-back" size={28} color={palette.light} />
        </TouchableOpacity>
        <Text style={{ color: palette.light, fontSize: 18, fontWeight: "600", marginLeft: 12 }}>
          {isEditMode ? "Edit Item" : "Add Item"}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, marginTop: 10 }}>
        {/* Lost / Found Toggle */}
        <View style={{ flexDirection: "row", marginBottom: 16 }}>
          {(["Lost", "Found"] as const).map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setStatus(s)}
              style={{
                flex: 1,
                paddingVertical: 12,
                backgroundColor: status === s ? palette.accent : palette.darker,
                borderRadius: 12,
                marginHorizontal: 4,
              }}
            >
              <Text style={{ textAlign: "center", color: palette.light, fontWeight: "600" }}>
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Image Picker */}
        <TouchableOpacity
          onPress={handleImagePicker}
          style={{
            height: 180,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: palette.darker,
            marginBottom: 16,
            overflow: "hidden",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: palette.darker,
          }}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={{ width: "100%", height: "100%" }} />
          ) : (
            <Text style={{ color: palette.light }}>Tap to select image</Text>
          )}
        </TouchableOpacity>

        {/* Inputs */}
        <TextInput
          placeholder="Title"
          placeholderTextColor={palette.light}
          value={title}
          onChangeText={setTitle}
          style={{ backgroundColor: palette.darker, color: palette.light, padding: 12, borderRadius: 12, marginBottom: 12 }}
        />
        <TextInput
          placeholder="Description"
          placeholderTextColor={palette.light}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          style={{ backgroundColor: palette.darker, color: palette.light, padding: 12, borderRadius: 12, marginBottom: 12 }}
        />
        <TextInput
          placeholder="Contact Number"
          placeholderTextColor={palette.light}
          value={contact}
          onChangeText={setContact}
          keyboardType="phone-pad"
          style={{ backgroundColor: palette.darker, color: palette.light, padding: 12, borderRadius: 12, marginBottom: 12 }}
        />

        {/* Categories */}
        <ScrollView horizontal style={{ marginBottom: 12 }}>
          {categoriesList.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setCategory(cat.name)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                marginRight: 8,
                borderRadius: 24,
                backgroundColor: category === cat.name ? palette.accent : palette.darker,
              }}
            >
              <Text style={{ color: palette.light, fontWeight: "600" }}>{cat.name}</Text>
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

        {validLocation && (
          <Text style={{ color: palette.light, marginBottom: 12 }}>
            Selected Location: Lat {itemLocation.lat?.toFixed(4)}, Lng {itemLocation.lng?.toFixed(4)}
          </Text>
        )}

        {/* Submit */}
        <TouchableOpacity
          onPress={handleSubmit}
          style={{ backgroundColor: palette.accent, paddingVertical: 16, borderRadius: 24, alignItems: "center" }}
        >
          <Text style={{ color: palette.light, fontWeight: "700", fontSize: 16 }}>
            {isEditMode ? "Update Item" : "Save Item"}
          </Text>
        </TouchableOpacity>

        <Toast />

        {/* Success Modal */}
        <Modal visible={successModalVisible} transparent animationType="fade" onRequestClose={() => setSuccessModalVisible(false)}>
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" }}>
            <View style={{ width: 300, backgroundColor: palette.darker, padding: 20, borderRadius: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 12, color: palette.light }}>Success!</Text>
              <Text style={{ marginBottom: 20, color: palette.light }}>
                {isEditMode ? "Item updated successfully." : "Your item has been saved successfully."}
              </Text>
              <TouchableOpacity
                onPress={() => { setSuccessModalVisible(false); if (!isEditMode) router.back(); }}
                style={{ backgroundColor: palette.accent, padding: 12, borderRadius: 8 }}
              >
                <Text style={{ color: palette.light, textAlign: "center", fontWeight: "600" }}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

export default FoundlyItemFormScreen;
