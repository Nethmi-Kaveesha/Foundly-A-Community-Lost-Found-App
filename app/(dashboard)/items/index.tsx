import { useLoader } from "@/context/LoaderContext";
import { deleteItem, itemColRef } from "@/services/itemService";
import { Item } from "@/types/item";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Alert, Dimensions, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const screenWidth = Dimensions.get("window").width;
const categories = ["All", "Pets", "Electronics", "Bags", "Keys"];

// Image placeholder component
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

  const router = useRouter();
  const { showLoader, hideLoader } = useLoader();
  const auth = getAuth();
  const currentUser = auth.currentUser;

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

  // Filter items
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

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="px-5 py-4 flex-row justify-between items-center bg-white shadow">
        <Text className="text-2xl font-bold text-gray-900">Foundly</Text>
        <Ionicons name="person-circle-outline" size={36} color="#3B82F6" />
      </View>

      {/* Lost/Found Toggle */}
      <View className="flex-row mx-5 my-3 bg-gray-200 rounded-xl overflow-hidden">
        {(["Lost", "Found"] as const).map((s) => (
          <TouchableOpacity
            key={s}
            onPress={() => setStatusFilter(s)}
            className={`flex-1 py-3 rounded-xl ${statusFilter === s ? (s === "Lost" ? "bg-blue-500" : "bg-green-500") : ""}`}
          >
            <Text className={`text-center font-semibold ${statusFilter === s ? "text-white" : "text-gray-700"}`}>
              {s}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Row 1: Search + Location */}
      <View style={{ paddingHorizontal: 10, marginBottom: 10, flexDirection: 'row' }}>
        <TextInput
          placeholder="Search items..."
          value={searchKeyword}
          onChangeText={setSearchKeyword}
          style={{
            flex: 1,
            backgroundColor: 'white',
            borderWidth: 1,
            borderColor: '#D1D5DB',
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
            backgroundColor: 'white',
            borderWidth: 1,
            borderColor: '#D1D5DB',
            padding: 10,
            borderTopRightRadius: 12,
            borderBottomRightRadius: 12,
            marginLeft: 5,
          }}
        />
      </View>

      {/* Row 2: Categories */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, marginBottom: 10 }}>
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
              borderColor: '#D1D5DB',
              backgroundColor: categoryFilter === cat ? '#3B82F6' : 'white',
            }}
          >
            <Text style={{ fontWeight: '600', color: categoryFilter === cat ? 'white' : '#374151' }}>
              {cat}
            </Text>
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
          filteredItems.map((item) => (
            <View
              key={item.id}
              style={{
                width: screenWidth / 2 - 20,
                backgroundColor: "#fff",
                borderRadius: 16,
                marginBottom: 12,
                overflow: "hidden",
                elevation: 3,
                borderWidth: item.matchedItemId ? 2 : 0,
                borderColor: item.matchedItemId ? "#FBBF24" : "transparent",
              }}
            >
              <ImagePlaceholder photoURL={item.photoURL} />
              <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#111827', textAlign: 'center' }} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={{ fontSize: 12, color: '#6B7280', textAlign: 'center' }} numberOfLines={2}>
                  {item.description}
                </Text>
                <Text style={{ textAlign: 'center', marginTop: 4, fontSize: 12, fontWeight: '600', color: '#F59E0B' }}>
                  {item.matchedItemId ? "⚡ Matched!" : item.status}
                </Text>

                {item.userId === currentUser?.uid && (
                  <View style={{ flexDirection: 'row', marginTop: 8, justifyContent: 'space-between' }}>
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
                      <Text style={{ fontSize: 12, fontWeight: '600', color: '#111827' }}>Edit</Text>
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
                      onPress={() => item.id && handleDelete(item.id)}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '600', color: 'white' }}>Delete</Text>
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
        style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          backgroundColor: '#3B82F6',
          width: 64,
          height: 64,
          borderRadius: 32,
          alignItems: 'center',
          justifyContent: 'center',
          elevation: 5,
        }}
        onPress={() => router.push("/items/new")}
      >
        <MaterialIcons name="add" size={32} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default FoundlyItemsScreen;
