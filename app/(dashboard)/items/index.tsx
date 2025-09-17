"use client";

import { useLoader } from "@/context/LoaderContext";
import { deleteItem, itemColRef } from "@/services/itemService";
import { Item } from "@/types/item";
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { doc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
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
      <Image source={{ uri: photoURL }} style={{ width: "100%", height: 120, borderRadius: 12 }} resizeMode="cover" />
    ) : (
      <View
        style={{
          width: "100%",
          height: 120,
          borderRadius: 12,
          backgroundColor: "#EEEEEE",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="image-outline" size={36} color="#393E46" />
      </View>
    )}
  </View>
);

// Categories
const categories = [
  { label: "Pets", icon: <Ionicons name="paw-outline" size={16} color="#00ADB5" /> },
  { label: "Electronics", icon: <MaterialCommunityIcons name="laptop" size={16} color="#00ADB5" /> },
  { label: "Bags", icon: <Ionicons name="briefcase-outline" size={16} color="#00ADB5" /> },
  { label: "Keys", icon: <Ionicons name="key-outline" size={16} color="#00ADB5" /> },
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
            backgroundColor: isSelected ? "#888888" : "#D8D8D8",
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 20,
            marginRight: 8,
          }}
        >
          {cat.icon}
          <Text style={{ color: isSelected ? "#222831" : "#393E46", fontWeight: "500", marginLeft: 6 }}>{cat.label}</Text>
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
              backgroundColor: isSelected ? "#00ADB5" : "#EEEEEE",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              marginRight: 8,
            }}
          >
            <Text style={{ color: isSelected ? "#222831" : "#393E46", fontWeight: "500" }}>{status}</Text>
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
  const [modalVisible, setModalVisible] = useState(false); // Nearby/Match modal
  const [nearbyItems, setNearbyItems] = useState<Item[]>([]);
  const [matchedItems, setMatchedItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const router = useRouter();
  const { showLoader, hideLoader } = useLoader();
  const auth = getAuth();
  const currentUser = auth.currentUser;

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
    setModalVisible(true);
  };

  const renderItemCard = (item: Item) => {
    const isNearby =
      userLocation && item.location?.lat && item.location?.lng
        ? getDistanceKm(userLocation.lat, userLocation.lng, item.location.lat, item.location.lng) <= 5
        : false;
    const isMatched = !!findMatchingItem(item, items);

    const ribbons: { color: string; text: string }[] = [];
    if (isMatched && isNearby) ribbons.push({ color: "#00ADB5", text: "⚡ MATCH & 📍 NEARBY" });
    else if (isMatched) ribbons.push({ color: "#00ADB5", text: "⚡ MATCH!" });
    else if (isNearby) ribbons.push({ color: "#00ADB5", text: "📍 NEARBY" });

    return (
      <TouchableOpacity
        key={item.id}
        onPress={() => {
          setSelectedItem(item);
          setDetailModalVisible(true);
        }}
        style={{
          flexDirection: "row",
          backgroundColor: "#222831",
          borderRadius: 16,
          marginBottom: 12,
          overflow: "hidden",
          elevation: 3,
          width: "100%",
          padding: 8,
        }}
      >
        <Image source={{ uri: item.photoURL }} style={{ width: 120, height: 120, borderRadius: 12 }} resizeMode="cover" />
        <View style={{ flex: 1, marginLeft: 12, justifyContent: "space-between" }}>
          <View>
            <Text style={{ fontWeight: "bold", fontSize: 16, color: "#EEEEEE" }}>
              {item.title} {item.isVerified ? "✅" : ""}
            </Text>
            <Text style={{ fontSize: 14, color: "#00ADB5", marginTop: 4 }} numberOfLines={3}>
              {item.description}
            </Text>
            {ribbons.map((r, idx) => (
              <View
                key={idx}
                style={{
                  backgroundColor: r.color,
                  paddingVertical: 2,
                  paddingHorizontal: 6,
                  borderRadius: 8,
                  marginTop: 4,
                  alignSelf: "flex-start",
                }}
              >
                <Text style={{ color: "#222831", fontSize: 12 }}>{r.text}</Text>
              </View>
            ))}
          </View>

          <View style={{ flexDirection: "row", marginTop: 8, justifyContent: "flex-end" }}>
            {item.userId === currentUser?.uid ? (
              <>
                <TouchableOpacity
                  onPress={() => router.push(`/items/${item.id}`)}
                  style={{
                    marginRight: 4,
                    padding: 6,
                    borderRadius: 8,
                    backgroundColor: "#00ADB5",
                  }}
                >
                  <MaterialIcons name="edit" size={20} color="#222831" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(item.id)}
                  style={{
                    marginLeft: 4,
                    padding: 6,
                    borderRadius: 8,
                    backgroundColor: "#EF4444",
                  }}
                >
                  <MaterialIcons name="delete" size={20} color="#fff" />
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                onPress={() => handleReport(item)}
                style={{
                  padding: 6,
                  borderRadius: 8,
                  backgroundColor: "#00ADB5",
                }}
              >
                <MaterialIcons name="report" size={20} color="#222831" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: "#222831" }}>
      {/* Header */}
      <View
        style={{
          padding: 20,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#393E46",
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: "bold", color: "#EEEEEE" }}>Foundly</Text>
        <Ionicons name="person-circle-outline" size={36} color="#00ADB5" />
      </View>

      {/* Search */}
      <View style={{ padding: 10 }}>
        <TextInput
          placeholder="Search items..."
          placeholderTextColor="#00ADB5"
          value={searchKeyword}
          onChangeText={setSearchKeyword}
          style={{ backgroundColor: "#393E46", padding: 10, borderRadius: 12, color: "#EEEEEE" }}
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
      colors={["#181818", "#00ADB5"]} // gradient from black to blue
      start={[0, 0]}
      end={[1, 0]}
      style={{
        padding: 14,
        borderRadius: 12,
        alignItems: "center",
        // Shadow for iOS
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 }, // shadow below
        shadowOpacity: 0.5,
        shadowRadius: 4,
        // Shadow for Android
        elevation: 6,
      }}
    >
            <Text style={{ color: "white", fontWeight: "bold" }}>Check Nearby / Match</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Items Grid */}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 10,
          paddingBottom: 180,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {filteredItems.length === 0 ? (
          <View style={{ width: "100%", alignItems: "center", marginTop: 50 }}>
            <Ionicons name="happy-outline" size={64} color="#00ADB5" />
            <Text style={{ marginTop: 12, color: "#00ADB5", fontSize: 16 }}>No items found!</Text>
          </View>
        ) : (
          filteredItems.map((item) => <View key={item.id}>{renderItemCard(item)}</View>)
        )}
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={{
          position: "absolute",
          bottom: 90,
          right: 20,
          backgroundColor: "#00ADB5",
          width: 64,
          height: 64,
          borderRadius: 32,
          alignItems: "center",
          justifyContent: "center",
          elevation: 5,
        }}
        onPress={() => router.push("/items/new")}
      >
        <MaterialIcons name="add" size={32} color="#222831" />
      </TouchableOpacity>

      {/* ------------------ Detail Modal ------------------ */}
      <Modal visible={detailModalVisible} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center" }}>
          <View
            style={{
              width: "90%",
              backgroundColor: "#393E46",
              borderRadius: 16,
              padding: 16,
              elevation: 5,
            }}
          >
            <TouchableOpacity
              onPress={() => setDetailModalVisible(false)}
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                backgroundColor: "#EF4444",
                borderRadius: 20,
                width: 32,
                height: 32,
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10,
              }}
            >
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>

            {selectedItem && (
              <>
                {/* Item Image */}
                <Image
                  source={{ uri: selectedItem.photoURL }}
                  style={{ width: "100%", height: 180, borderRadius: 16, marginBottom: 12 }}
                />

                {/* Item Title */}
                <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 8, color: "#EEEEEE" }}>
                  {selectedItem.title} {selectedItem.isVerified ? "✅" : ""}
                </Text>

                {/* Description */}
                <Text style={{ fontSize: 14, color: "#00ADB5", marginBottom: 8 }}>{selectedItem.description}</Text>

                {/* Location */}
                {selectedItem.location && (
                  <Text style={{ marginBottom: 8, color: "#EEEEEE" }}>
                    Location: {selectedItem.location.lat?.toFixed(4)}, {selectedItem.location.lng?.toFixed(4)}
                  </Text>
                )}

                {/* Contact */}
                {selectedItem.contactInfo && (
                  <TouchableOpacity
                    style={{
                      backgroundColor: "#00ADB5",
                      paddingVertical: 12,
                      paddingHorizontal: 20,
                      borderRadius: 16,
                      alignItems: "center",
                      marginBottom: 12,
                    }}
                    onPress={() => Linking.openURL(`tel:${selectedItem.contactInfo}`)}
                  >
                    <Text style={{ color: "#222831", fontWeight: "bold", fontSize: 16 }}>Call Contact</Text>
                  </TouchableOpacity>
                )}

                {/* Mark Resolved */}
                {selectedItem.userId === currentUser?.uid && !selectedItem.resolved && (
                  <TouchableOpacity
                    onPress={handleMarkResolved}
                    style={{
                      backgroundColor: "#00ADB5",
                      paddingVertical: 12,
                      paddingHorizontal: 20,
                      borderRadius: 16,
                      alignItems: "center",
                      marginBottom: 12,
                    }}
                  >
                    <Text style={{ color: "#222831", fontWeight: "bold", fontSize: 16 }}>Mark as Resolved</Text>
                  </TouchableOpacity>
                )}

                {/* Report */}
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
                    <Text style={{ color: "#222831", fontWeight: "bold", fontSize: 16 }}>Report Item</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
      {/* ---------------------------------------------------- */}

      {/* ------------------ Nearby / Match Modal ------------------ */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center" }}>
          <View
            style={{
              width: "90%",
              backgroundColor: "#393E46",
              borderRadius: 16,
              padding: 16,
              elevation: 5,
            }}
          >
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                backgroundColor: "#EF4444",
                borderRadius: 20,
                width: 32,
                height: 32,
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10,
              }}
            >
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>

            <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12, color: "#EEEEEE" }}>
              Nearby Items
            </Text>
            <ScrollView style={{ maxHeight: 200, marginBottom: 12 }}>
              {nearbyItems.length === 0 ? (
                <Text style={{ color: "#00ADB5" }}>No nearby items found.</Text>
              ) : (
                nearbyItems.map((item) => (
                  <Text key={item.id} style={{ color: "#EEEEEE", marginBottom: 4 }}>
                    {item.title} ({item.category})
                  </Text>
                ))
              )}
            </ScrollView>

            <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12, color: "#EEEEEE" }}>
              Matched Items
            </Text>
            <ScrollView style={{ maxHeight: 200 }}>
              {matchedItems.length === 0 ? (
                <Text style={{ color: "#00ADB5" }}>No matched items found.</Text>
              ) : (
                matchedItems.map((item) => (
                  <Text key={item.id} style={{ color: "#EEEEEE", marginBottom: 4 }}>
                    {item.title} ({item.category})
                  </Text>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
      {/* ---------------------------------------------------- */}

      <Toast />
    </SafeAreaView>
  );
};

export default FoundlyItemsScreen;
