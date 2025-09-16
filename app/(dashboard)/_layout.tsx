import { useAuth } from "@/context/AuthContext"
import { Entypo, Ionicons, MaterialIcons } from "@expo/vector-icons"
import { Tabs, useRouter } from "expo-router"
import React, { useEffect } from "react"
import { ActivityIndicator, SafeAreaView, View } from "react-native"

const FoundlyDashboardLayout = () => {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading])

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#3B82F6",
          tabBarInactiveTintColor: "#6B7280",
          tabBarStyle: {
            backgroundColor: "#F9FAFB",
            borderTopWidth: 0,
            elevation: 5,
            paddingVertical: 6,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "600",
          },
        }}
      >
        {/* Home Tab */}
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
          }}
        />

        {/* Posts Tab */}
        <Tabs.Screen
          name="posts"
          options={{
            title: "Posts",
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="inventory-2" size={size} color={color} />
            ),
          }}
        />

        {/* Profile Tab */}
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="person-outline" size={size} color={color} />
            ),
          }}
        />

        {/* Map Tab */}
        <Tabs.Screen
          name="map"
          options={{
            title: "Map",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="map-outline" size={size} color={color} />
            ),
          }}
        />

        {/* Map Picker Tab */}
        <Tabs.Screen
          name="map-picker"
          options={{
            title: "Map Picker",
            tabBarIcon: ({ color, size }) => (
              <Entypo name="location-pin" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </SafeAreaView>
  )
}

export default FoundlyDashboardLayout
