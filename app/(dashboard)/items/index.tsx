"use client";

import { useLoader } from "@/context/LoaderContext";
import { deleteItem, itemColRef } from "@/services/itemService";
import { Item } from "@/types/item";
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { doc, onSnapshot, setDoc, updateDoc } from "firebase/firestore"; // added setDoc
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Linking,
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
        style={{ width: "100%", height: 120, borderRadius: 12 }}
        resizeMode="cover"
      />
    ) : (
      <View
        style={{
          width: "100%",
          height: 120,
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

// Categories
const categories = [
  { label: "Pets", icon: <Ionicons name="paw-outline" size={16} color="#fff" /> },
  { label: "Electronics", icon: <MaterialCommunityIcons name="laptop" size={16} color="#fff" /> },
  { label: "Bags", icon: <Ionicons name="briefcase-outline" size={16} color="#fff" /> },
  { label: "Keys", icon: <Ionicons name="key-outline" size={16} color="#fff" /> },
];

const CategoryFilter = ({
  selectedCategory,
  setSelectedCategory,
}: {
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
}) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: "row", marginVertical: 8 }}>
    {categories.map((cat) => {
      const isSelected = selectedCategory === cat.label;
      return (
        <TouchableOpacity
          key={cat.label}
          onPress={() => setSelectedCategory(isSelected ? "All" : cat.label)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: isSelected ? "#3B82F6" : "#E5E7EB",
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 20,
            marginRight: 8,
          }}
        >
          {cat.icon}
          <Text style={{ color: isSelected ? "#fff" : "#374151", fontWeight: "500", marginLeft: 6 }}>
            {cat.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </ScrollView>
);

const StatusToggle = ({
  statusFilter,
  setStatusFilter,
}: {
  statusFilter: "All" | "Lost" | "Found";
  setStatusFilter: (val: "All" | "Lost" | "Found") => void;
}) => {
  const statuses: ("All" | "Lost" | "Found")[] = ["All", "Lost", "Found"];
  return (
    <View style={{ flexDirection: "row", marginVertical: 8 }}>
      {statuses.map((status) => {
        const isSelected = statusFilter === status;
        return (
          <TouchableOpacity
            key={status}
            onPress={() => setStatusFilter(status)}
            style={{
              backgroundColor: isSelected ? "#3B82F6" : "#E5E7EB",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              marginRight: 8,
            }}
          >
            <Text style={{ color: isSelected ? "#fff" : "#374151", fontWeight: "500" }}>{status}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const FoundlyItemsScreen = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [statusFilter, setStatusFilter] = useState<"All" | "Lost" | "Found">("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
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

  // Mark as resolved
  const handleMarkResolved = async () => {
    if (!selectedItem?.id) return;
    try {
      await updateDoc(doc(itemColRef.firestore, "items", selectedItem.id), { resolved: true });
      setSelectedItem({ ...selectedItem, resolved: true });
      setItems((prev) =>
        prev.map((item) => (item.id === selectedItem.id ? { ...item, resolved: true } : item))
      );
      Toast.show({ type: "success", text1: "Item marked as resolved!" });
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to mark resolved.");
    }
  };

  // Report item
  const handleReport = async (item: Item) => {
    if (!item.id) return;

    if (Platform.OS === "web") {
      const reason = prompt("Please provide a reason for reporting this item:");
      if (!reason) return;

      try {
        const reportRef = doc(itemColRef.firestore, "reports", `${item.id}_${Date.now()}`);
        await setDoc(reportRef, {
          itemId: item.id,
          title: item.title,
          reason,
          reporterId: currentUser?.uid || null,
          createdAt: new Date(),
        });
        Toast.show({ type: "success", text1: "Report submitted successfully!" });
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Failed to report the item.");
      }
    } else {
      // TODO: Implement Expo prompt/modal for mobile if needed
      Alert.alert("Report", "Reporting is only implemented for web prompt.");
    }
  };

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

    if (userLocation) {
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

  const findMatchingItem = (item: Item, allItems: Item[]) =>
    allItems.find(
      (i) => i.id !== item.id && i.category === item.category && i.title.toLowerCase() === item.title.toLowerCase()
    );

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
  };

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

    const ribbons: { color: string; text: string }[] = [];
    if (isMatched && isNearby) ribbons.push({ color: "#EF4444", text: "⚡ MATCH & 📍 NEARBY" });
    else if (isMatched) ribbons.push({ color: "#FBBF24", text: "⚡ MATCH!" });
    else if (isNearby) ribbons.push({ color: "#10B981", text: "📍 NEARBY" });
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
            setDetailModalVisible(true);
          }}
        >
          <View style={{ position: "relative" }}>
            <ImagePlaceholder photoURL={item.photoURL} />
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
                <Text style={{ color: "#fff", fontWeight: "bold", textAlign: "center", fontSize: 12 }}>
                  {r.text}
                </Text>
              </View>
            ))}
          </View>

          <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
            <Text style={{ fontWeight: "bold", fontSize: 16, textAlign: "center" }} numberOfLines={1}>
              {item.title} {item.isVerified ? "✅" : ""}
            </Text>
            <Text style={{ fontSize: 12, color: "#6B7280", textAlign: "center" }} numberOfLines={2}>
              {item.description}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={{ flexDirection: "row", margin: 8, justifyContent: "space-between" }}>
          {item.userId === currentUser?.uid ? (
            <>
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
            </>
          ) : (
            <TouchableOpacity
              onPress={() => handleReport(item)}
              style={{
                flex: 1,
                marginLeft: 4,
                height: 36,
                borderRadius: 8,
                backgroundColor: "#F59E0B",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "600", color: "#fff" }}>Report</Text>
            </TouchableOpacity>
          )}
        </View>
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
          style={{ backgroundColor: "#fff", padding: 10, borderRadius: 12 }}
        />
      </View>

      {/* Filters */}
      <View style={{ paddingHorizontal: 10 }}>
        <CategoryFilter selectedCategory={categoryFilter} setSelectedCategory={setCategoryFilter} />
        <StatusToggle statusFilter={statusFilter} setStatusFilter={setStatusFilter} />
      </View>

      {/* Check Nearby / Match */}
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

      {/* Item Detail Modal */}
      <Modal visible={detailModalVisible} animationType="slide" transparent>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: "90%",
              backgroundColor: "#fff",
              borderRadius: 16,
              padding: 16,
              elevation: 5,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
            }}
          >
            {/* Close Icon */}
            <TouchableOpacity
              onPress={() => setDetailModalVisible(false)}
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                zIndex: 10,
                backgroundColor: "#EF4444",
                borderRadius: 20,
                width: 32,
                height: 32,
                alignItems: "center",
                justifyContent: "center",
                elevation: 3,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.25,
                shadowRadius: 2,
              }}
            >
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>

            {selectedItem && (
              <>
                {/* Item Image */}
                <Image
                  source={{ uri: selectedItem.photoURL }}
                  style={{
                    width: "100%",
                    height: 180,
                    borderRadius: 16,
                    marginBottom: 12,
                  }}
                  resizeMode="cover"
                />

                {/* Item Details */}
                <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 8 }}>
                  {selectedItem.title} {selectedItem.isVerified ? "✅" : ""}
                </Text>
                <Text style={{ fontSize: 14, color: "#374151", marginBottom: 8 }}>
                  {selectedItem.description}
                </Text>
                {selectedItem.location && (
                  <Text style={{ marginBottom: 8 }}>
                    Location: {selectedItem.location.lat?.toFixed(4) ?? "N/A"}, {selectedItem.location.lng?.toFixed(4) ?? "N/A"}
                  </Text>
                )}

                {/* Contact Button */}
                {selectedItem.contactInfo && (
                  <TouchableOpacity
                    style={{
                      backgroundColor: "#3B82F6",
                      paddingVertical: 12,
                      paddingHorizontal: 20,
                      borderRadius: 16,
                      alignItems: "center",
                      marginBottom: 12,
                      elevation: 3,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.25,
                      shadowRadius: 3.84,
                    }}
                    onPress={() => Linking.openURL(`tel:${selectedItem.contactInfo}`)}
                  >
                    <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>Call Contact</Text>
                  </TouchableOpacity>
                )}

                {/* Mark as Resolved button */}
                {selectedItem.userId === currentUser?.uid && !selectedItem.resolved && (
                  <TouchableOpacity
                    onPress={handleMarkResolved}
                    style={{
                      backgroundColor: "#10B981",
                      paddingVertical: 12,
                      paddingHorizontal: 20,
                      borderRadius: 16,
                      alignItems: "center",
                      marginBottom: 12,
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>Mark as Resolved</Text>
                  </TouchableOpacity>
                )}

                {/* Report button */}
                {selectedItem.userId !== currentUser?.uid && (
                  <TouchableOpacity
                    onPress={() => handleReport(selectedItem)}
                    style={{
                      backgroundColor: "#F59E0B",
                      paddingVertical: 12,
                      paddingHorizontal: 20,
                      borderRadius: 16,
                      alignItems: "center",
                      marginBottom: 12,
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>Report Item</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      <Toast />
    </SafeAreaView>
  );
};

export default FoundlyItemsScreen;
