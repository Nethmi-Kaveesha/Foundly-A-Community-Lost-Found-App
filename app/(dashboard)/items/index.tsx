"use client";

import { useLoader } from "@/context/LoaderContext";
import { deleteItem, itemColRef } from "@/services/itemService";
import { Item } from "@/types/item";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const screenWidth = Dimensions.get("window").width;

// Distance calculation
const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
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
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sortOption, setSortOption] = useState("Newest");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<"Nearby" | "Match">("Nearby");
  const [nearbyItems, setNearbyItems] = useState<Item[]>([]);
  const [matchedItems, setMatchedItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const router = useRouter();
  const { showLoader, hideLoader } = useLoader();
  const auth = getAuth();
  const currentUser = auth.currentUser;

  // User location
  useEffect(() => {
    const getLocation = async () => {
      try {
        if (Platform.OS === "web") {
          navigator.geolocation.getCurrentPosition(
            (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            (err) => console.warn("Web location error:", err),
            { enableHighAccuracy: true }
          );
        } else {
          const Location = await import("expo-location");
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== "granted") return;
          const loc = await Location.getCurrentPositionAsync({});
          setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        }
      } catch (err) {
        console.error("Location error:", err);
      }
    };
    getLocation();
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

  // Filter items
  const applyFilters = (list: Item[]) => {
    let filtered = list
      .filter((i) => (statusFilter === "All" ? true : i.status === statusFilter))
      .filter((i) => (categoryFilter === "All" ? true : i.category === categoryFilter))
      .filter((i) =>
        searchKeyword
          ? i.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
            i.description.toLowerCase().includes(searchKeyword.toLowerCase())
          : true
      );

    if (sortOption === "Nearest" && userLocation) {
      filtered = filtered.sort((a, b) => {
        const distA =
          a.location?.lat && a.location?.lng
            ? getDistanceKm(userLocation.lat, userLocation.lng, a.location.lat, a.location.lng)
            : Infinity;
        const distB =
          b.location?.lat && b.location?.lng
            ? getDistanceKm(userLocation.lat, userLocation.lng, b.location.lat, b.location.lng)
            : Infinity;
        return distA - distB;
      });
    }
    return filtered;
  };

  const filteredItems = applyFilters(items);

  // Matching logic
  const findMatchingItem = (item: Item, allItems: Item[]) => {
    return allItems.find(
      (i) =>
        i.id !== item.id &&
        i.category === item.category &&
        i.title.toLowerCase() === item.title.toLowerCase()
    );
  };

  // Nearby & Match
  const handleCheckNearby = () => {
    if (!userLocation) return Alert.alert("Location Error", "User location not available");

    const nearbyRaw = items.filter(
      (i) =>
        i.location?.lat != null &&
        i.location?.lng != null &&
        getDistanceKm(userLocation.lat, userLocation.lng, i.location.lat, i.location.lng) <= 5
    );

    const nearby = applyFilters(nearbyRaw);

    const matchedSet = new Set<string>();
    const matched: Item[] = [];

    nearby.forEach((item) => {
      const match = findMatchingItem(item, items);
      if (match) {
        const matchId = match.id || match.title + match.category;
        if (!matchedSet.has(matchId)) {
          matched.push(match);
          matchedSet.add(matchId);
        }
      }
    });

    setNearbyItems(nearby);
    setMatchedItems(matched);
    setActiveTab(matched.length > 0 ? "Match" : "Nearby");
    setModalVisible(true);

    if (nearby.length === 0) Toast.show({ type: "info", text1: "Nearby Items Not Found" });
    else
      Toast.show({
        type: "info",
        text1: "Nearby Items Found",
        text2: `Found ${nearby.length} nearby items!`,
      });

    if (matched.length === 0) Toast.show({ type: "error", text1: "No Matches Found" });
    else
      Toast.show({
        type: "success",
        text1: "Matches Found",
        text2: `Found ${matched.length} matches!`,
      });
  };

  // Render item card
  const renderItemCard = (item: Item) => {
    const isNearby =
      userLocation && item.location?.lat && item.location?.lng
        ? getDistanceKm(userLocation.lat, userLocation.lng, item.location.lat, item.location.lng) <= 5
        : false;

    const isMatched = !!findMatchingItem(item, items);

    const isSearchMatch =
      searchKeyword &&
      (item.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        item.description.toLowerCase().includes(searchKeyword.toLowerCase()));

    // Ribbons
    const ribbons: { color: string; text: string }[] = [];

    if (isMatched && isNearby) ribbons.push({ color: "#EF4444", text: "⚡ MATCH & 📍 NEARBY" });
    else if (isMatched) ribbons.push({ color: "#FBBF24", text: "MATCH!" });
    else if (isNearby) ribbons.push({ color: "#10B981", text: "NEARBY" });

    if (isSearchMatch) ribbons.push({ color: "#3B82F6", text: "🔍 Keyword" });

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
        }}
      >
        <TouchableOpacity
          onPress={() => {
            setSelectedItem(item);
            setDetailModalVisible(true); // open modal
          }}
        >
          <View style={{ position: "relative" }}>
            <ImagePlaceholder photoURL={item.photoURL} />

            {/* Render ribbons */}
            {ribbons.map((r, idx) => (
              <View
                key={idx}
                style={{
                  position: "absolute",
                  top: 10 + idx * 20,
                  left: -40,
                  width: 140,
                  transform: [{ rotate: "-45deg" }],
                  backgroundColor: r.color,
                  paddingVertical: 4,
                  zIndex: 10,
                  elevation: 5,
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontWeight: "bold",
                    textAlign: "center",
                    fontSize: 12,
                  }}
                >
                  {r.text}
                </Text>
              </View>
            ))}
          </View>

          <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
            <Text style={{ fontWeight: "bold", fontSize: 16, textAlign: "center" }} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={{ fontSize: 12, color: "#6B7280", textAlign: "center" }} numberOfLines={2}>
              {item.description}
            </Text>
          </View>
        </TouchableOpacity>

        {item.userId === currentUser?.uid && (
          <View style={{ flexDirection: "row", margin: 8, justifyContent: "space-between" }}>
            <TouchableOpacity
              onPress={() => router.push(`/items/${item.id}`)}
              style={{
                flex: 1,
                marginRight: 4,
                height: 36,
                borderRadius: 8,
                backgroundColor: "#FCD34D",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "600", color: "#111827" }}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleDelete(item.id)}
              style={{
                flex: 1,
                marginLeft: 4,
                height: 36,
                borderRadius: 8,
                backgroundColor: "#EF4444",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "600", color: "white" }}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="px-5 py-4 flex-row justify-between items-center bg-white shadow">
        <Text className="text-2xl font-bold text-gray-900">Foundly</Text>
        <Ionicons name="person-circle-outline" size={36} color="#3B82F6" />
      </View>

      {/* Search */}
      <View style={{ padding: 10 }}>
        <TextInput
          placeholder="Search items..."
          value={searchKeyword}
          onChangeText={setSearchKeyword}
          style={{ backgroundColor: "#fff", padding: 10, borderRadius: 12, marginBottom: 6 }}
        />
      </View>

      {/* Combined Filters */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          paddingHorizontal: 10,
          marginBottom: 10,
        }}
      >
        {/* Category Picker */}
        <View
          style={{
            flex: 1,
            marginRight: 6,
            backgroundColor: "#fff",
            borderRadius: 12,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: "#E5E7EB",
          }}
        >
          <Picker
            selectedValue={categoryFilter}
            onValueChange={(val) => setCategoryFilter(val)}
            dropdownIconColor="#3B82F6"
          >
            <Picker.Item label="📦 All Categories" value="All" />
            <Picker.Item label="🐶 Pets" value="Pets" />
            <Picker.Item label="💻 Electronics" value="Electronics" />
            <Picker.Item label="🎒 Bags" value="Bags" />
            <Picker.Item label="🔑 Keys" value="Keys" />
          </Picker>
        </View>

        {/* Status Picker */}
        <View
          style={{
            flex: 1,
            marginLeft: 6,
            backgroundColor: "#fff",
            borderRadius: 12,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: "#E5E7EB",
          }}
        >
          <Picker
            selectedValue={statusFilter}
            onValueChange={(val) => setStatusFilter(val as "All" | "Lost" | "Found")}
            dropdownIconColor="#10B981"
          >
            <Picker.Item label="📋 All Status" value="All" />
            <Picker.Item label="❌ Lost" value="Lost" />
            <Picker.Item label="✅ Found" value="Found" />
          </Picker>
        </View>
      </View>

      {/* Check Nearby / Match Button */}
      <View style={{ padding: 10 }}>
        <TouchableOpacity
          onPress={handleCheckNearby}
          disabled={!userLocation || items.length === 0}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#34D399", "#10B981"]}
            start={[0, 0]}
            end={[1, 0]}
            style={{ padding: 14, borderRadius: 12, alignItems: "center" }}
          >
            <Text style={{ color: "#fff", fontWeight: "bold" }}>Check Nearby / Match</Text>
          </LinearGradient>
        </TouchableOpacity>
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
          <View style={{ width: "100%", alignItems: "center", marginTop: 50 }}>
            <Ionicons name="happy-outline" size={64} color="#9CA3AF" />
            <Text style={{ marginTop: 12, color: "#6B7280", fontSize: 16 }}>No items found!</Text>
          </View>
        ) : (
          filteredItems.map(renderItemCard)
        )}
      </ScrollView>

      {/* Floating Add Button */}
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

      {/* Details Modal */}
      <Modal visible={detailModalVisible} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 }}>
          <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 16, position: "relative" }}>
            {/* Close button */}
            <TouchableOpacity
              onPress={() => setDetailModalVisible(false)}
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                backgroundColor: "#EF4444",
                width: 32,
                height: 32,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10,
              }}
            >
              <Ionicons name="close" size={20} color="white" />
            </TouchableOpacity>

            {selectedItem && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <ImagePlaceholder photoURL={selectedItem.photoURL} />
                <Text style={{ fontSize: 20, fontWeight: "bold", marginVertical: 8 }}>
                  {selectedItem.title}
                </Text>
                <Text style={{ fontSize: 14, color: "#6B7280", marginBottom: 8 }}>
                  {selectedItem.description}
                </Text>
                <Text style={{ fontSize: 14 }}>📂 Category: {selectedItem.category}</Text>
                <Text style={{ fontSize: 14 }}>📌 Status: {selectedItem.status}</Text>

                {selectedItem.userId === currentUser?.uid && (
                  <View style={{ flexDirection: "row", marginTop: 12 }}>
                    <TouchableOpacity
                      onPress={() => {
                        setDetailModalVisible(false);
                        router.push(`/items/${selectedItem.id}`);
                      }}
                      style={{
                        flex: 1,
                        marginRight: 4,
                        height: 36,
                        borderRadius: 8,
                        backgroundColor: "#FCD34D",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: "600", color: "#111827" }}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        setDetailModalVisible(false);
                        handleDelete(selectedItem.id);
                      }}
                      style={{
                        flex: 1,
                        marginLeft: 4,
                        height: 36,
                        borderRadius: 8,
                        backgroundColor: "#EF4444",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: "600", color: "white" }}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default FoundlyItemsScreen;
