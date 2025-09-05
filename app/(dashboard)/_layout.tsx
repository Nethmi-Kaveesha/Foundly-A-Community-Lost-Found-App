import { useAuth } from "@/context/AuthContext"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"
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
          tabBarActiveTintColor: "#3B82F6", // Foundly blue
          tabBarInactiveTintColor: "#6B7280", // Gray
          tabBarStyle: {
            backgroundColor: "#F3F4F6", // light gray
            borderTopWidth: 0,
            elevation: 5
          }
        }}
      >
        {/* Home Tab */}
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            )
          }}
        />

        {/* Items Tab (was Tasks) */}
        <Tabs.Screen
          name="items"
          options={{
            title: "Items",
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="inventory" size={size} color={color} />
            )
          }}
        />

        {/* Profile Tab */}
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="person" size={size} color={color} />
            )
          }}
        />

        {/* Settings Tab */}
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="settings" size={size} color={color} />
            )
          }}
        />
      </Tabs>
    </SafeAreaView>
  )
}

export default FoundlyDashboardLayout
