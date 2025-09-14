"use client";

import { useLoader } from "@/context/LoaderContext";
import { deleteItem, itemColRef } from "@/services/itemService";
import { findMatchingItem } from "@/services/matchService";
import { Item } from "@/types/item";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
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

// --------------------- Dropdown Component ---------------------
const DropdownFilter = ({
  label,
  selected,
  options,
  onSelect,
  openDropdown,
  setOpenDropdown,
}: {
  label: string;
  selected: string;
  options: string[];
  onSelect: (val: string) => void;
  openDropdown: string | null;
  setOpenDropdown: (val: string | null) => void;
}) => {
  const isOpen = openDropdown === label;

  const opacity = useState(new Animated.Value(0))[0];
  const translateY = useState(new Animated.Value(-20))[0];
  const rotate = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -20, duration: 150, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [isOpen]);

  const rotation = rotate.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] });

  return (
    <View style={{ marginRight: 8 }}>
      <TouchableOpacity
        onPress={() => setOpenDropdown(isOpen ? null : label)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: selected !== "All" ? "#3B82F6" : "#E5E7EB",
          paddingHorizontal: 14,
          paddingVertical: 6,
          borderRadius: 20,
        }}
      >
        <Text style={{ color: selected !== "All" ? "#fff" : "#374151", fontWeight: "500" }}>
          {label}: {selected}
        </Text>
        <Animated.View style={{ marginLeft: 6, transform: [{ rotate: rotation }] }}>
          <Ionicons name="chevron-down" size={16} color={selected !== "All" ? "#fff" : "#374151"} />
        </Animated.View>
      </TouchableOpacity>

      {isOpen && (
        <Modal transparent visible={isOpen} animationType="none">
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setOpenDropdown(null)}>
            <Animated.View
              style={{
                position: "absolute",
                top: 50,
                left: 10,
                backgroundColor: "#fff",
                borderRadius: 12,
                paddingVertical: 4,
                minWidth: 120,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 5,
                opacity: opacity,
                transform: [{ translateY: translateY }],
              }}
            >
              {options.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  onPress={() => {
                    onSelect(opt);
                    setOpenDropdown(null);
                  }}
                  style={{ padding: 10 }}
                >
                  <Text style={{ color: opt === selected ? "#3B82F6" : "#374151", fontWeight: "500" }}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
};

// --------------------- Main Screen ---------------------
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
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const router = useRouter();
  const { showLoader, hideLoader } = useLoader();
  const auth = getAuth();
  const currentUser = auth.currentUser;

  // Get user location
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

  // Load all items
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

  // Filters
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

  const renderItemCard = (item: Item) => {
    const isNearby =
      userLocation && item.location?.lat && item.location?.lng
        ? getDistanceKm(userLocation.lat, userLocation.lng, item.location.lat, item.location.lng) <= 5
        : false;
    const isMatched = !!findMatchingItem(item, items);

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

  // ------------------- Check Nearby / Match -------------------
  const handleCheckNearby = () => {
    if (!userLocation) return Alert.alert("Location Error", "User location not available");

    const nearbyRaw = items.filter(
      (i) =>
        i.location?.lat != null &&
        i.location?.lng != null &&
        getDistanceKm(userLocation.lat, userLocation.lng, i.location.lat, i.location.lng) <= 5
    );

    const nearby = applyFilters(nearbyRaw);
    const matched: Item[] = [];
    nearby.forEach((item) => {
      const match = findMatchingItem(item, items);
      if (match) matched.push(match);
    });
    const matchedFiltered = applyFilters(matched);

    setNearbyItems(nearby);
    setMatchedItems(matchedFiltered);
    setActiveTab("Nearby");
    setModalVisible(true);

    if (nearby.length)
      Toast.show({ type: "info", text1: "Nearby Items Found", text2: `Found ${nearby.length} nearby items!` });
    if (matchedFiltered.length)
      Toast.show({ type: "success", text1: "Matches Found", text2: `Found ${matchedFiltered.length} matches!` });
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="px-5 py-4 flex-row justify-between items-center bg-white shadow">
        <Text className="text-2xl font-bold text-gray-900">Foundly</Text>
        <Ionicons name="person-circle-outline" size={36} color="#3B82F6" />
      </View>

      {/* Search and Filters */}
      <View style={{ padding: 10 }}>
        <TextInput
          placeholder="Search items..."
          value={searchKeyword}
          onChangeText={setSearchKeyword}
          style={{ backgroundColor: "#fff", padding: 10, borderRadius: 12, marginBottom: 6 }}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: "row" }}>
          <DropdownFilter
            label="Status"
            selected={statusFilter}
            options={["All", "Lost", "Found"]}
            onSelect={(val) => setStatusFilter(val as any)}
            openDropdown={openDropdown}
            setOpenDropdown={setOpenDropdown}
          />
          <DropdownFilter
            label="Category"
            selected={categoryFilter}
            options={["All", "Pets", "Electronics", "Bags", "Keys"]}
            onSelect={setCategoryFilter}
            openDropdown={openDropdown}
            setOpenDropdown={setOpenDropdown}
          />
          <DropdownFilter
            label="Sort"
            selected={sortOption}
            options={["Newest", "Nearest"]}
            onSelect={setSortOption}
            openDropdown={openDropdown}
            setOpenDropdown={setOpenDropdown}
          />
        </ScrollView>
      </View>

      {/* Check Nearby / Match Button */}
      <View style={{ padding: 10 }}>
        <TouchableOpacity onPress={handleCheckNearby} disabled={!userLocation || items.length === 0} activeOpacity={0.8}>
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

      {/* Nearby / Match Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center" }}>
          <View style={{ backgroundColor: "white", margin: 20, borderRadius: 16, padding: 16 }}>
            {/* Tabs */}
            <View style={{ flexDirection: "row", marginBottom: 12 }}>
              {["Nearby", "Match"].map((tab) => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab as "Nearby" | "Match")}
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

            <FlatList
              data={activeTab === "Nearby" ? nearbyItems : matchedItems}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id || Math.random().toString()}
              renderItem={({ item }) => renderItemCard(item)}
              snapToInterval={screenWidth * 0.7 + 16}
              decelerationRate="fast"
              contentContainerStyle={{ paddingHorizontal: 10 }}
            />

            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginTop: 16, alignSelf: "center", padding: 8 }}>
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
