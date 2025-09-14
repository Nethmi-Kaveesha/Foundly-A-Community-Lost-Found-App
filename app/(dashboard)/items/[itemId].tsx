"use client";

import { itemColRef } from "@/services/itemService";
import { Item } from "@/types/item";
import { useLocalSearchParams } from "expo-router"; // correct hook
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

const ItemDetailsScreen = () => {
  const params = useLocalSearchParams<{ itemId: string }>(); // typed params
  const itemId = params.itemId;

  const [item, setItem] = useState<Item | null>(null);

  useEffect(() => {
    const fetchItem = async () => {
      if (!itemId) return;
      const docRef = doc(itemColRef, itemId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setItem({ id: docSnap.id, ...docSnap.data() } as Item);
      }
    };
    fetchItem();
  }, [itemId]);

  return (
    <View style={{ padding: 16 }}>
      <Text>Item ID: {itemId}</Text>
      <Text>Title: {item?.title}</Text>
      {item?.location && (
        <Text>
          Location: Lat {item.location.lat?.toFixed(4)}, Lng {item.location.lng?.toFixed(4)}
        </Text>
      )}
    </View>
  );
};

export default ItemDetailsScreen;
