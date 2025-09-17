import { useAuth } from "@/context/AuthContext"
import { Entypo, Ionicons, MaterialIcons } from "@expo/vector-icons"
import { Tabs, useRouter } from "expo-router"
import React, { useEffect } from "react"
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  View
} from "react-native"

const FoundlyDashboardLayout = () => {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/welcome")
    }
  }, [user, loading])

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00ADB5" />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Tabs
  screenOptions={{
    headerShown: false,
    tabBarInactiveTintColor: "#EEEEEE",
    tabBarStyle: {
      position: "absolute",
      backgroundColor: "rgba(34, 40, 49, 0.7)", // semi-transparent dark
      borderTopWidth: 0,
      elevation: 0,
      height: 70,
      paddingBottom: 8,
      borderRadius: 20,
      marginHorizontal: 16,
      marginBottom: 12,
      shadowColor: "#00ADB5",
      shadowOpacity: 0.2,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 10,
    },
    tabBarLabelStyle: {
      fontSize: 12,
      fontWeight: "600",
    },
  }}
>
  {/* Home */}
  <Tabs.Screen
    name="home"
    options={{
      title: "Home",
      tabBarActiveTintColor: "#00ADB5",
      tabBarIcon: ({ color, size }) => (
        <Ionicons name="home-outline" size={size} color={color} />
      ),
    }}
  />

  {/* Posts */}
  <Tabs.Screen
  name="items"
  options={{
    title: "Posts",
    tabBarIcon: ({ color, size }) => (
      <MaterialIcons name="inventory-2" size={size} color={color} />
    ),
  }}
/>


  {/* Profile */}
  <Tabs.Screen
    name="profile"
    options={{
      title: "Profile",
      tabBarActiveTintColor: "#393E46",
      tabBarIcon: ({ color, size }) => (
        <MaterialIcons name="person-outline" size={size} color={color} />
      ),
    }}
  />

  {/* Map Picker */}
  <Tabs.Screen
  name="mappicker"
  options={{
    title: "Map",
    tabBarIcon: ({ color, size }) => (
      <Entypo name="location-pin" size={size} color={color} />
    ),
  }}
/>

</Tabs>

    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#222831",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#222831",
  },
})

export default FoundlyDashboardLayout
