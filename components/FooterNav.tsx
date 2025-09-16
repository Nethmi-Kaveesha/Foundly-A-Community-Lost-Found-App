import { Ionicons } from "@expo/vector-icons";
import { useRouter, useSegments } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, Pressable, Text, View } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const FooterNav = () => {
  const router = useRouter();
  const segment = useSegments();
  const activeRoute = "/" + (segment[0] || "");

  const navItems = [
    { name: "Home", icon: "home-outline", route: "/" },
    { name: "Item", icon: "cube-outline", route: "/item/444", params: { name: "kavee", age: 21, address: "colombo" } },
    { name: "Profile", icon: "person-outline", route: "/profile" },
    { name: "User", icon: "people-outline", route: "/user" },
    { name: "Login", icon: "log-in-outline", route: "/login" },
  ];

  const [activeIndex, setActiveIndex] = useState(
    navItems.findIndex((item) => item.route === activeRoute) || 0
  );
  const indicatorAnim = useRef(new Animated.Value(activeIndex * (SCREEN_WIDTH / navItems.length))).current;

  // Animate the indicator when activeIndex changes
  useEffect(() => {
    Animated.spring(indicatorAnim, {
      toValue: activeIndex * (SCREEN_WIDTH / navItems.length),
      useNativeDriver: true,
    }).start();
  }, [activeIndex]);

  const handlePress = (item: any, index: number) => {
    setActiveIndex(index);
    if (item.params) {
      router.push({ pathname: item.route, params: item.params });
    } else {
      router.push(item.route);
    }
  };

  const itemWidth = SCREEN_WIDTH / navItems.length;

  return (
    <View style={{
      backgroundColor: "#fff",
      flexDirection: "row",
      position: "relative",
      borderTopWidth: 1,
      borderTopColor: "#e0e0e0",
      paddingVertical: 10,
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowOffset: { width: 0, height: -2 },
      shadowRadius: 4,
      elevation: 3,
    }}>
      {/* Animated Indicator */}
      <Animated.View style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        width: itemWidth,
        height: 4,
        borderRadius: 2,
        backgroundColor: "#7C3AED",
        transform: [{ translateX: indicatorAnim }],
      }} />

      {navItems.map((item, index) => (
        <Pressable
          key={item.name}
          onPress={() => handlePress(item, index)}
          style={({ pressed }) => ({
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 6,
            transform: [{ scale: pressed ? 0.9 : 1 }],
          })}
        >
          <Ionicons
            name={item.icon as keyof typeof Ionicons.glyphMap}
            size={24}
            color={activeIndex === index ? "#7C3AED" : "#999"}
          />
          <Text style={{
            marginTop: 2,
            fontSize: 12,
            color: activeIndex === index ? "#7C3AED" : "#999",
            fontWeight: activeIndex === index ? "600" : "400"
          }}>
            {item.name}
          </Text>
        </Pressable>
      ))}
    </View>
  );
};

export default FooterNav;
