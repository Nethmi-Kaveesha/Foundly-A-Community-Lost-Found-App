"use client";

import { useLoader } from "@/context/LoaderContext";
import { deleteItem, itemColRef } from "@/services/itemService";
import { findMatchingItem } from "@/services/matchService";
import { Item } from "@/types/item";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const screenWidth = Dimensions.get("window").width;
const categories = ["All", "Pets", "Electronics", "Bags", "Keys"];

// Distance calculator (Haversine formula)
const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Image placeholder
const ImagePlaceholder = ({ photoURL }: { photoURL?: string }) => (
  <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 8 }}>
    {photoURL ? (
      <Image
        source={{ uri: photoURL }}
        style={{ width: "100%", height: 160, borderRadius: 12 }}
        resizeMode="cover"
      />
    ) : (
      <View
        style={{
          width: "100%",
          height: 160,
          borderRadius: 12,
          backgroundColor: "#E5E7EB",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="image-outline" size={36} color="#9CA3AF" />
      </View>
    )}
  </View>
);

const FoundlyItemsScreen = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [statusFilter, setStatusFilter] = useState<"All" | "Lost" | "Found">("All");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<"Nearby" | "Match">("Nearby");
  const [nearbyItems, setNearbyItems] = useState<Item[]>([]);
  const [matchedItems, setMatchedItems] = useState<Item[]>([]);
  const [scrollIndex, setScrollIndex] = useState(0);

  const router = useRouter();
  const { showLoader, hideLoader } = useLoader();
  const auth = getAuth();
  const currentUser = auth.currentUser;

  // Get user location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.warn("Location permission denied");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    })();
  }, []);

  // Load items
  useEffect(() => {
    showLoader();
    const unsubscribe = onSnapshot(
      itemColRef,
      (snapshot) => {
        const itemList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Item[];
        setItems(itemList);
        hideLoader();
      },
      (err) => {
        console.error(err);
        hideLoader();
      }
    );
    return () => unsubscribe();
  }, []);

  // Delete item
  const handleDelete = (itemId?: string) => {
    if (!itemId) return;
    Alert.alert("Delete Item", "Are you sure you want to delete this item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            showLoader();
            await deleteItem(itemId);
            setItems((prev) => prev.filter((item) => item.id !== itemId));
          } catch (err) {
            console.error("Error deleting item:", err);
            Alert.alert("Error", "Failed to delete item.");
          } finally {
            hideLoader();
          }
        },
      },
    ]);
  };

  // Check Nearby / Matches
  const handleCheckNearby = () => {
    if (!userLocation) {
      Alert.alert("Location Error", "User location not available");
      return;
    }

    const nearby = items.filter(
      (i) =>
        i.location?.lat != null &&
        i.location?.lng != null &&
        getDistanceKm(userLocation.lat, userLocation.lng, i.location.lat, i.location.lng) <= 5
    );

    const matched: Item[] = [];
    nearby.forEach((item) => {
      const match = findMatchingItem(item, items);
      if (match) matched.push(match);
    });

    setNearbyItems(nearby);
    setMatchedItems(matched);
    setActiveTab("Nearby");
    setScrollIndex(0);
    setModalVisible(true);

    if (nearby.length > 0)
      Toast.show({ type: "info", text1: "Nearby Items Found", text2: `Found ${nearby.length} nearby items!` });

    if (matched.length > 0)
      Toast.show({ type: "success", text1: "Matches Found", text2: `Found ${matched.length} matches!` });
  };

  const filteredItems = items
    .filter((i) => (statusFilter === "All" ? true : i.status === statusFilter))
    .filter((i) => (categoryFilter === "All" ? true : i.category === categoryFilter))
    .filter((i) =>
      searchKeyword
        ? i.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          i.description.toLowerCase().includes(searchKeyword.toLowerCase())
        : true
    )
    .filter((i) => {
      if (!locationFilter || !i.location?.address) return true;
      return i.location.address.toLowerCase().includes(locationFilter.toLowerCase());
    });

  const renderItemCard = (item: Item) => {
    let isNearby = false;
    let isMatched = false;

    if (userLocation && item.location?.lat != null && item.location?.lng != null) {
      isNearby = getDistanceKm(userLocation.lat, userLocation.lng, item.location.lat, item.location.lng) <= 5;
    }

    isMatched = !!findMatchingItem(item, items);

    return (
      <View
        key={item.id}
        style={{
          width: screenWidth / 2 - 20,
          backgroundColor: "#fff",
          borderRadius: 16,
          marginBottom: 12,
          overflow: "hidden",
          elevation: 3,
          borderWidth: isMatched ? 2 : 0,
          borderColor: isMatched ? "#FBBF24" : "transparent",
        }}
      >
        <ImagePlaceholder photoURL={item.photoURL} />
        <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
          <Text style={{ fontWeight: "bold", fontSize: 16, textAlign: "center" }} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={{ fontSize: 12, color: "#6B7280", textAlign: "center" }} numberOfLines={2}>
            {item.description}
          </Text>

          {(isNearby || isMatched) && (
            <Text
              style={{
                textAlign: "center",
                marginTop: 4,
                fontSize: 12,
                fontWeight: "600",
                color: isMatched ? "#F59E0B" : "#10B981",
              }}
            >
              {isMatched ? "⚡ Matched!" : "📍 Nearby"}
            </Text>
          )}

          {item.userId === currentUser?.uid && (
            <View style={{ flexDirection: "row", marginTop: 8, justifyContent: "space-between" }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  marginRight: 4,
                  height: 36,
                  borderRadius: 8,
                  backgroundColor: "#FCD34D",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onPress={() => item.id && router.push(`/items/${item.id}`)}
              >
                <Text style={{ fontSize: 12, fontWeight: "600", color: "#111827" }}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  marginLeft: 4,
                  height: 36,
                  borderRadius: 8,
                  backgroundColor: "#EF4444",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onPress={() => handleDelete(item.id)}
              >
                <Text style={{ fontSize: 12, fontWeight: "600", color: "white" }}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (!userLocation) return <Text style={{ padding: 20 }}>Loading location...</Text>;

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="px-5 py-4 flex-row justify-between items-center bg-white shadow">
        <Text className="text-2xl font-bold text-gray-900">Foundly</Text>
        <Ionicons name="person-circle-outline" size={36} color="#3B82F6" />
      </View>

      {/* Check Nearby / Match Button */}
      <View style={{ padding: 10 }}>
        <TouchableOpacity
          onPress={handleCheckNearby}
          style={{ backgroundColor: "#10B981", padding: 12, borderRadius: 12, alignItems: "center" }}
        >
          <Text style={{ color: "#fff", fontWeight: "bold" }}>Check Nearby / Match</Text>
        </TouchableOpacity>
      </View>

      {/* Lost/Found Toggle */}
      <View className="flex-row mx-5 my-3 bg-gray-200 rounded-xl overflow-hidden">
        {(["Lost", "Found"] as const).map((s) => (
          <TouchableOpacity
            key={s}
            onPress={() => setStatusFilter(s)}
            className={`flex-1 py-3 rounded-xl ${statusFilter === s ? (s === "Lost" ? "bg-blue-500" : "bg-green-500") : ""}`}
          >
            <Text className={`text-center font-semibold ${statusFilter === s ? "text-white" : "text-gray-700"}`}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search + Location */}
      <View style={{ paddingHorizontal: 10, marginBottom: 10, flexDirection: "row" }}>
        <TextInput
          placeholder="Search items..."
          value={searchKeyword}
          onChangeText={setSearchKeyword}
          style={{
            flex: 1,
            backgroundColor: "white",
            borderWidth: 1,
            borderColor: "#D1D5DB",
            padding: 10,
            borderTopLeftRadius: 12,
            borderBottomLeftRadius: 12,
            marginRight: 5,
          }}
        />
        <TextInput
          placeholder="Location..."
          value={locationFilter}
          onChangeText={setLocationFilter}
          style={{
            flex: 1,
            backgroundColor: "white",
            borderWidth: 1,
            borderColor: "#D1D5DB",
            padding: 10,
            borderTopRightRadius: 12,
            borderBottomRightRadius: 12,
            marginLeft: 5,
          }}
        />
      </View>

      {/* Categories */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 10, marginBottom: 10 }}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => setCategoryFilter(cat)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              marginRight: 8,
              marginBottom: 8,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: "#D1D5DB",
              backgroundColor: categoryFilter === cat ? "#3B82F6" : "white",
            }}
          >
            <Text style={{ fontWeight: "600", color: categoryFilter === cat ? "white" : "#374151" }}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Items Grid */}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 10,
          paddingBottom: 180,
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "space-between",
        }}
        keyboardShouldPersistTaps="handled"
      >
        {filteredItems.length === 0 ? (
          <View className="w-full items-center justify-center mt-20">
            <Ionicons name="happy-outline" size={64} color="#9CA3AF" />
            <Text className="mt-4 text-gray-500 text-lg">No items found!</Text>
          </View>
        ) : (
          filteredItems.map(renderItemCard)
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={{
          position: "absolute",
          bottom: 20,
          right: 20,
          backgroundColor: "#3B82F6",
          width: 64,
          height: 64,
          borderRadius: 32,
          alignItems: "center",
          justifyContent: "center",
          elevation: 5,
        }}
        onPress={() => router.push("/items/new")}
      >
        <MaterialIcons name="add" size={32} color="white" />
      </TouchableOpacity>

      {/* Nearby / Match Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center" }}>
          <View style={{ backgroundColor: "white", margin: 20, borderRadius: 16, padding: 16 }}>
            {/* Tabs */}
            <View style={{ flexDirection: "row", marginBottom: 12 }}>
              {["Nearby", "Match"].map((tab) => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => {
                    setActiveTab(tab as "Nearby" | "Match");
                    setScrollIndex(0);
                  }}
                  style={{
                    flex: 1,
                    padding: 8,
                    borderBottomWidth: 2,
                    borderBottomColor: activeTab === tab ? "#3B82F6" : "transparent",
                  }}
                >
                  <Text style={{ textAlign: "center", fontWeight: "600" }}>{tab}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Horizontal FlatList with snap */}
            <FlatList
              data={activeTab === "Nearby" ? nearbyItems : matchedItems}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id || Math.random().toString()}
              renderItem={({ item }) => renderItemCard(item)}
              onScroll={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / (screenWidth * 0.7 + 16));
                setScrollIndex(index);
              }}
              scrollEventThrottle={16}
              snapToInterval={screenWidth * 0.7 + 16}
              decelerationRate="fast"
              contentContainerStyle={{ paddingHorizontal: 10 }}
            />

            {/* Scroll Dots */}
            <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 8 }}>
              {(activeTab === "Nearby" ? nearbyItems : matchedItems).map((_, i) => (
                <View
                  key={i}
                  style={{
                    width: scrollIndex === i ? 12 : 8,
                    height: scrollIndex === i ? 12 : 8,
                    borderRadius: 6,
                    backgroundColor: scrollIndex === i ? "#3B82F6" : "#D1D5DB",
                    marginHorizontal: 4,
                  }}
                />
              ))}
            </View>

            {/* Close button */}
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={{ marginTop: 16, alignSelf: "center", padding: 8 }}
            >
              <Text style={{ color: "#EF4444", fontWeight: "600" }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Toast />
    </SafeAreaView>
  );
};

export default FoundlyItemsScreen;
