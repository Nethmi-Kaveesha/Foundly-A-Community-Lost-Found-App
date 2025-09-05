import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import { Dimensions, Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { LineChart, PieChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

const HomeScreen = () => {
  const [menuVisible, setMenuVisible] = useState(false);
  const navigation = useNavigation();

  const lostItemsData = [
    { name: "Wallet", count: 30, color: "#7C3AED", legendFontColor: "#7C3AED", legendFontSize: 12 },
    { name: "Keys", count: 20, color: "#A78BFA", legendFontColor: "#A78BFA", legendFontSize: 12 },
    { name: "Phone", count: 50, color: "#C4B5FD", legendFontColor: "#C4B5FD", legendFontSize: 12 },
  ];

  const lineData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [{ data: [20, 45, 28, 80, 99, 43], color: () => "#7C3AED", strokeWidth: 3 }],
    legend: ["Lost Items Reported"],
  };

  const menuItems = [
    { name: "Home", route: "Home" },
    { name: "About", route: "About" },
    { name: "Features", route: "Features" },
    { name: "Pricing", route: "Pricing" },
    { name: "Contact", route: "Contact" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F3FF" }}>
      {/* Navbar */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#7C3AED", paddingVertical: 12, paddingHorizontal: 16 }}>
        <Text style={{ color: "white", fontSize: 24, fontWeight: "bold" }}>Foundly</Text>
        <TouchableOpacity onPress={() => setMenuVisible(true)} style={{ padding: 8, borderRadius: 50, backgroundColor: "#6B21A8" }}>
          <Ionicons name="menu-outline" size={28} color="white" />
        </TouchableOpacity>
      </View>

      {/* Hamburger Menu Modal */}
      <Modal visible={menuVisible} animationType="slide" transparent onRequestClose={() => setMenuVisible(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.3)" }} onPress={() => setMenuVisible(false)}>
          <View style={{ width: screenWidth * 0.6, backgroundColor: "white", paddingTop: 50, paddingHorizontal: 20, height: "100%" }}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.name}
                onPress={() => {
                  setMenuVisible(false);
                  navigation.navigate(item.route as never);
                }}
                style={{ paddingVertical: 16 }}
              >
                <Text style={{ color: "#7C3AED", fontSize: 18, fontWeight: "600" }}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Main Content */}
      <ScrollView>
        {/* Hero Section */}
        <View style={{ paddingVertical: 60, paddingHorizontal: 20, alignItems: "center", backgroundColor: "#EDE9FE" }}>
          <Text style={{ fontSize: 28, fontWeight: "bold", color: "#4C1D95", textAlign: "center", marginBottom: 8 }}>Lost & Found Dashboard</Text>
          <Text style={{ textAlign: "center", color: "#5B21B6", fontSize: 14, marginBottom: 16 }}>
            Track lost & found items, view trends, and help recover lost belongings with ease.
          </Text>
          <TouchableOpacity style={{ backgroundColor: "#7C3AED", paddingHorizontal: 40, paddingVertical: 12, borderRadius: 50 }}>
            <Text style={{ color: "white", fontWeight: "600", textAlign: "center" }}>Get Started</Text>
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={{ paddingVertical: 40, paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 24, fontWeight: "bold", color: "#4C1D95", textAlign: "center", marginBottom: 8 }}>About Foundly</Text>
          <Text style={{ textAlign: "center", color: "#5B21B6", fontSize: 14, lineHeight: 20 }}>
            Foundly is a community-driven lost and found platform helping people recover lost items quickly. Join thousands of users helping each other every day.
          </Text>
        </View>

        {/* Features Section */}
        <View style={{ paddingVertical: 40, paddingHorizontal: 20, backgroundColor: "#F5F3FF" }}>
          <Text style={{ fontSize: 24, fontWeight: "bold", color: "#4C1D95", textAlign: "center", marginBottom: 20 }}>Features</Text>
          {[ 
            { icon: "flash-outline" as keyof typeof Ionicons.glyphMap, title: "Quick Reporting", description: "Report lost or found items in seconds." },
            { icon: "notifications-outline" as keyof typeof Ionicons.glyphMap, title: "Search & Alerts", description: "Receive notifications for matching items." },
            { icon: "shield-checkmark-outline" as keyof typeof Ionicons.glyphMap, title: "Safe & Secure", description: "Verified reports for reliability." },
          ].map((feature) => (
            <View key={feature.title} style={{ flexDirection: "row", alignItems: "center", padding: 16, backgroundColor: "white", borderRadius: 20, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.1, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6 }}>
              <Ionicons name={feature.icon} size={28} color="#7C3AED" style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "600", color: "#4C1D95", fontSize: 16 }}>{feature.title}</Text>
                <Text style={{ color: "#5B21B6", fontSize: 14, marginTop: 4 }}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Pricing Section */}
        <View style={{ paddingVertical: 40, paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 24, fontWeight: "bold", color: "#4C1D95", textAlign: "center", marginBottom: 20 }}>Pricing</Text>
          {[
            { title: "Free Plan", description: "Basic reporting and alerts for everyone." },
            { title: "Pro Plan", description: "Advanced features including priority notifications and analytics." },
          ].map((plan) => (
            <View key={plan.title} style={{ backgroundColor: "white", padding: 20, borderRadius: 20, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.1, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6 }}>
              <Text style={{ fontSize: 18, fontWeight: "bold", color: "#4C1D95", marginBottom: 4 }}>{plan.title}</Text>
              <Text style={{ fontSize: 14, color: "#5B21B6", marginBottom: 8 }}>{plan.description}</Text>
              <TouchableOpacity style={{ backgroundColor: "#7C3AED", paddingVertical: 8, paddingHorizontal: 20, borderRadius: 50 }}>
                <Text style={{ color: "white", fontWeight: "600", textAlign: "center" }}>Choose Plan</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Statistics Section */}
        <View style={{ paddingVertical: 40, paddingHorizontal: 20, backgroundColor: "#F5F3FF" }}>
          <Text style={{ fontSize: 24, fontWeight: "bold", color: "#4C1D95", textAlign: "center", marginBottom: 16 }}>Statistics</Text>
          <Text style={{ color: "#5B21B6", fontWeight: "600", marginBottom: 8 }}>Monthly Lost Items</Text>
          <LineChart
            data={lineData}
            width={screenWidth - 40}
            height={200}
            chartConfig={{
              backgroundGradientFrom: "#EDE9FE",
              backgroundGradientTo: "#DDD6FE",
              color: (opacity = 1) => `rgba(124, 58, 237, ${opacity})`,
              labelColor: () => "#4C1D95",
              propsForDots: { r: "5", strokeWidth: "2", stroke: "#7C3AED" },
              decimalPlaces: 0,
            }}
            style={{ borderRadius: 20, marginVertical: 8 }}
          />
          <Text style={{ color: "#5B21B6", fontWeight: "600", marginTop: 16, marginBottom: 8 }}>Lost Items by Type</Text>
          <PieChart
            data={lostItemsData}
            width={screenWidth - 40}
            height={200}
            chartConfig={{
              backgroundGradientFrom: "#EDE9FE",
              backgroundGradientTo: "#DDD6FE",
              color: () => "#7C3AED",
            }}
            accessor="count"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </View>

        {/* Contact Section */}
        <View style={{ paddingVertical: 40, paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 24, fontWeight: "bold", color: "#4C1D95", textAlign: "center", marginBottom: 8 }}>Contact Support</Text>
          <Text style={{ textAlign: "center", color: "#5B21B6", fontSize: 14, marginBottom: 16 }}>
            Have questions? Reach out anytime. We’re here to help you recover lost items quickly.
          </Text>
          <TouchableOpacity style={{ backgroundColor: "#7C3AED", paddingVertical: 12, paddingHorizontal: 40, borderRadius: 50, alignSelf: "center" }}>
            <Text style={{ color: "white", fontWeight: "600", textAlign: "center" }}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default HomeScreen;
