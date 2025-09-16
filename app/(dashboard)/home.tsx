import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LineChart, PieChart } from "react-native-chart-kit";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const HomeScreen = () => {
  const navigation = useNavigation();

  // FAB state
  const [fabOpen, setFabOpen] = useState(false);
  const fabAnim = useRef(new Animated.Value(0)).current;

  const toggleFab = () => {
    setFabOpen(!fabOpen);
    Animated.spring(fabAnim, { toValue: fabOpen ? 0 : 1, useNativeDriver: true }).start();
  };

  // Interpolations for FAB buttons
  const reportAnim = {
    transform: [{ translateY: fabAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -70] }) }],
    opacity: fabAnim,
  };
  const searchAnim = {
    transform: [{ translateY: fabAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -140] }) }],
    opacity: fabAnim,
  };
  const alertAnim = {
    transform: [{ translateY: fabAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -210] }) }],
    opacity: fabAnim,
  };

  // Sample data for charts
  const lostItemsData = [
    { name: "Wallet", count: 30, color: "#7C3AED", legendFontColor: "#7C3AED", legendFontSize: 12 },
    { name: "Keys", count: 20, color: "#A78BFA", legendFontColor: "#A78BFA", legendFontSize: 12 },
    { name: "Phone", count: 50, color: "#C4B5FD", legendFontColor: "#C4B5FD", legendFontSize: 12 },
  ];
  const lineData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [{ data: [20, 45, 28, 80, 99, 43], color: () => "#fff", strokeWidth: 3 }],
    legend: ["Lost Items Reported"],
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appTitle}>FounApp</Text>
        <TouchableOpacity style={styles.menuBtn}>
          <Ionicons name="menu-outline" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 180 }}>
        {/* Hero Section */}
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Lost & Found Dashboard</Text>
          <Text style={styles.heroSubtitle}>
            Track lost & found items, view trends, and recover items quickly.
          </Text>
          <TouchableOpacity style={styles.heroButton}>
            <Text style={styles.heroButtonText}>Report Item</Text>
          </TouchableOpacity>
        </View>

        {/* Features Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          {[
            { icon: "flash-outline", title: "Quick Reporting", description: "Report lost or found items instantly." },
            { icon: "notifications-outline", title: "Alerts & Updates", description: "Get notified for matching items." },
            { icon: "shield-checkmark-outline", title: "Verified Reports", description: "Ensuring safety & reliability." },
          ].map((feature) => (
            <View key={feature.title} style={styles.featureCard}>
              <Ionicons name={feature.icon as keyof typeof Ionicons.glyphMap} size={28} color="#fff" style={{ marginRight: 12 }} />
              <View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Statistics Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <Text style={styles.chartLabel}>Monthly Lost Items</Text>
          <View style={styles.chartCard}>
            <LineChart
              data={lineData}
              width={SCREEN_WIDTH - 56}
              height={180}
              chartConfig={{
                backgroundGradientFrom: "#7C3AED",
                backgroundGradientTo: "#C4B5FD",
                color: (opacity = 1) => `rgba(255,255,255,${opacity})`,
                labelColor: () => "#fff",
                propsForDots: { r: "5", strokeWidth: "2", stroke: "#fff" },
              }}
              style={{ borderRadius: 20 }}
            />
          </View>

          <Text style={styles.chartLabel}>Lost Items by Type</Text>
          <View style={styles.chartCard}>
            <PieChart
              data={lostItemsData}
              width={SCREEN_WIDTH - 56}
              height={180}
              chartConfig={{
                backgroundGradientFrom: "#7C3AED",
                backgroundGradientTo: "#C4B5FD",
                color: () => "#fff",
              }}
              accessor="count"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button with Animated Actions */}
      <View style={styles.fabContainer}>
        <Animated.View style={[styles.fabAction, reportAnim]}>
          <Ionicons name="add-circle-outline" size={28} color="#fff" />
          <Text style={styles.fabLabel}>Report Lost</Text>
        </Animated.View>
        <Animated.View style={[styles.fabAction, searchAnim]}>
          <Ionicons name="search-outline" size={28} color="#fff" />
          <Text style={styles.fabLabel}>Search Items</Text>
        </Animated.View>
        <Animated.View style={[styles.fabAction, alertAnim]}>
          <Ionicons name="notifications-outline" size={28} color="#fff" />
          <Text style={styles.fabLabel}>Alerts</Text>
        </Animated.View>

        <TouchableOpacity style={styles.fab} onPress={toggleFab} activeOpacity={0.8}>
          <Ionicons name={fabOpen ? "close-outline" : "add-outline"} size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F3FF" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#7C3AED", paddingVertical: 12, paddingHorizontal: 16, shadowColor: "#000", shadowOpacity: 0.2, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4 },
  appTitle: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  menuBtn: { padding: 8, borderRadius: 50, backgroundColor: "#6B21A8" },
  heroCard: { margin: 16, backgroundColor: "#7C3AED", borderRadius: 20, padding: 24, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.2, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6 },
  heroTitle: { fontSize: 26, fontWeight: "bold", color: "#fff", textAlign: "center", marginBottom: 8 },
  heroSubtitle: { fontSize: 14, color: "#EDE9FE", textAlign: "center", marginBottom: 16 },
  heroButton: { backgroundColor: "#fff", paddingVertical: 12, paddingHorizontal: 40, borderRadius: 50 },
  heroButtonText: { color: "#7C3AED", fontWeight: "600", textAlign: "center" },
  section: { marginVertical: 16, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 22, fontWeight: "bold", color: "#4C1D95", textAlign: "center", marginBottom: 16 },
  featureCard: { flexDirection: "row", backgroundColor: "#A78BFA", borderRadius: 16, padding: 16, marginBottom: 12, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.2, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6 },
  featureTitle: { fontSize: 16, fontWeight: "600", color: "#fff" },
  featureDesc: { fontSize: 14, color: "#EDE9FE", marginTop: 4 },
  chartLabel: { color: "#fff", fontWeight: "600", marginBottom: 8, marginTop: 16, alignSelf: "center" },
  chartCard: { backgroundColor: "#7C3AED", borderRadius: 20, padding: 12, marginVertical: 8, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.2, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6 },
  fabContainer: { position: "absolute", bottom: 24, right: 24, alignItems: "center" },
  fab: { backgroundColor: "#7C3AED", width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.3, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6 },
  fabAction: { position: "absolute", width: 120, flexDirection: "row", alignItems: "center", justifyContent: "flex-start", backgroundColor: "#7C3AED", padding: 12, borderRadius: 20, right: 70 },
  fabLabel: { color: "#fff", marginLeft: 8, fontWeight: "600" },
});

export default HomeScreen;
