import { useLoader } from "@/context/LoaderContext";
import { deleteItem, itemColRef } from "@/services/itemService";
import { Item } from "@/types/item";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Alert, Dimensions, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const screenWidth = Dimensions.get("window").width;

// Reusable Image Placeholder component
const ImagePlaceholder = ({ photoURL }: { photoURL?: string }) => (
  <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 8 }}>
    {photoURL ? (
      <Image
        source={{ uri: photoURL }}
        style={{ width: "90%", height: 170, borderRadius: 12 }}
        resizeMode="cover"
      />
    ) : (
      <View
        style={{
          width: "80%",
          height: 120,
          borderRadius: 12,
          backgroundColor: "#E5E7EB",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="image-outline" size={32} color="#9CA3AF" />
      </View>
    )}
  </View>
);

const FoundlyItemsScreen = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [statusFilter, setStatusFilter] = useState<"All" | "Lost" | "Found">("All");

  const router = useRouter();
  const { showLoader, hideLoader } = useLoader();
  const auth = getAuth();
  const currentUser = auth.currentUser;

  // Firestore listener - fetch all items
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
        console.error("Firestore listener error:", err);
        hideLoader();
      }
    );
    return () => unsubscribe();
  }, []);

  // Delete item (owner only)
  const handleDelete = (itemId: string) => {
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

  // Filter items by status
  const filteredItems =
    statusFilter === "All" ? items : items.filter((item) => item.status === statusFilter);

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="px-5 py-4 flex-row justify-between items-center bg-white shadow">
        <Text className="text-2xl font-bold text-gray-900">Foundly</Text>
        <Ionicons name="person-circle-outline" size={34} color="#3B82F6" />
      </View>

      {/* Status Filter */}
      <View className="flex-row mx-5 my-4 bg-gray-200 rounded-xl overflow-hidden">
        {(["All", "Lost", "Found"] as const).map((s) => (
          <TouchableOpacity
            key={s}
            onPress={() => setStatusFilter(s)}
            className={`flex-1 py-3 rounded-xl ${
              statusFilter === s
                ? s === "Lost"
                  ? "bg-blue-500"
                  : s === "Found"
                  ? "bg-green-500"
                  : "bg-gray-400"
                : ""
            }`}
          >
            <Text
              className={`text-center font-semibold ${
                statusFilter === s ? "text-white" : "text-gray-700"
              }`}
            >
              {s}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Items List */}
      <ScrollView
        contentContainerStyle={{
          paddingBottom: 140,
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "space-around",
        }}
        keyboardShouldPersistTaps="handled"
      >
        {filteredItems.length === 0 ? (
          <View className="flex-1 items-center justify-center mt-20">
            <Ionicons name="happy-outline" size={64} color="#9CA3AF" />
            <Text className="mt-4 text-gray-500 text-lg">No items yet!</Text>
          </View>
        ) : (
          filteredItems.map((item) => (
            <View
              key={item.id}
              style={{
                width: screenWidth * 0.45,
                borderRadius: 16,
                backgroundColor: "#fff",
                marginVertical: 8,
                overflow: "hidden",
                elevation: 3,
                borderWidth: item.matchedItemId ? 2 : 0, // highlight matched items
                borderColor: item.matchedItemId ? "#FBBF24" : "transparent",
              }}
            >
              {/* Image */}
              <ImagePlaceholder photoURL={item.photoURL} />

              {/* Content */}
              <View className="px-3 pb-3">
                <Text
                  className="text-base font-bold text-gray-900 text-center"
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text
                  className="text-gray-600 text-xs text-center"
                  numberOfLines={2}
                >
                  {item.description}
                </Text>

                {/* Matched Status */}
                <Text className="text-center mt-1 text-sm font-semibold text-yellow-600">
                  {item.matchedItemId ? "⚡ Matched!" : item.status}
                </Text>

                {/* Edit/Delete Buttons (owner only) */}
                {item.userId === currentUser?.uid && (
                  <View className="flex-row mt-3 justify-between">
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        marginRight: 4,
                        height: 40,
                        borderRadius: 8,
                        backgroundColor: "#FCD34D",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onPress={() => item.id && router.push(`/items/${item.id}`)}
                    >
                      <Text className="text-xs font-semibold text-gray-800">Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={{
                        flex: 1,
                        marginLeft: 4,
                        height: 40,
                        borderRadius: 8,
                        backgroundColor: "#EF4444",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onPress={() => item.id && handleDelete(item.id)}
                    >
                      <Text className="text-xs font-semibold text-white">Delete</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-blue-500 w-16 h-16 rounded-full items-center justify-center shadow-lg"
        onPress={() => router.push("/items/new")}
      >
        <MaterialIcons name="add" size={32} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default FoundlyItemsScreen;
