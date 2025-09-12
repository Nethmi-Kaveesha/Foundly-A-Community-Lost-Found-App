import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import "leaflet/dist/leaflet.css";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

import "leaflet-control-geocoder/dist/Control.Geocoder.css";


const Index = () => {
  const router = useRouter();
  const { loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      router.push("/login"); // always go to login first
    }
  }, [loading]);

  return loading ? (
    <View className="flex-1 w-full justify-center items-center">
      <ActivityIndicator size="large" />
    </View>
  ) : null;
};

export default Index;
