import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

const HomePage = () => {
  const scrollViewRef = useRef<ScrollView>(null);

  const scrollToSection = (y: number) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y, animated: true });
    }
  };

  return (
    <LinearGradient
      colors={["#222831", "#393E46", "#00ADB5"]}
      style={styles.container}
    >
      {/* Sticky Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>Foundly</Text>
        <View style={styles.nav}>
          <TouchableOpacity onPress={() => scrollToSection(0)}>
            <Text style={styles.navText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => scrollToSection(400)}>
            <Text style={styles.navText}>Features</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => scrollToSection(800)}>
            <Text style={styles.navText}>About</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => scrollToSection(1200)}>
            <Text style={styles.navText}>Contact</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.scroll}>
        {/* Hero Section */}
        <BlurView intensity={80} tint="light" style={styles.card}>
          <Text style={styles.title}>Welcome to Foundly</Text>
          <Text style={styles.subtitle}>
            A smart way to connect lost & found items with their owners.
          </Text>
          <TouchableOpacity style={styles.glowButton}>
            <LinearGradient
              colors={["#00ADB5", "#393E46"]}
              style={styles.glowButtonGradient}
            >
              <Text style={styles.buttonText}>Get Started</Text>
            </LinearGradient>
          </TouchableOpacity>
        </BlurView>

        {/* Features Section */}
        <BlurView intensity={70} tint="dark" style={styles.card}>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.featureRow}>
            <Ionicons name="search" size={28} color="#00ADB5" />
            <Text style={styles.featureText}>Smart Item Search</Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons name="chatbubble-ellipses" size={28} color="#00ADB5" />
            <Text style={styles.featureText}>Community Chat</Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons name="shield-checkmark" size={28} color="#00ADB5" />
            <Text style={styles.featureText}>Verified Reports</Text>
          </View>
        </BlurView>

        {/* About Section */}
        <BlurView intensity={70} tint="light" style={styles.card}>
          <Text style={styles.sectionTitle}>About Us</Text>
          <Text style={styles.sectionText}>
            Foundly is a community-driven lost & found app that helps you
            reconnect with your belongings and support others in your area.
          </Text>
        </BlurView>

        {/* Contact Section */}
        <BlurView intensity={70} tint="dark" style={styles.card}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <Text style={styles.sectionText}>
            Have questions? Reach out at{" "}
            <Text style={{ color: "#00ADB5", fontWeight: "600" }}>
              support@foundly.com
            </Text>
          </Text>
        </BlurView>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "rgba(34, 40, 49, 0.9)",
  },
  logo: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#00ADB5",
  },
  nav: { flexDirection: "row", gap: 16 },
  navText: { color: "#EEEEEE", fontSize: 14, fontWeight: "600" },

  scroll: { padding: 20, paddingBottom: 80 },
  card: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: "#00ADB5",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#00ADB5",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "#EEEEEE",
    textAlign: "center",
    marginBottom: 20,
  },
  glowButton: { borderRadius: 30, overflow: "hidden", alignSelf: "center" },
  glowButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
    shadowColor: "#00ADB5",
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
  },
  buttonText: { color: "#EEEEEE", fontSize: 16, fontWeight: "bold" },

  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#00ADB5",
    marginBottom: 16,
  },
  featureRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  featureText: { fontSize: 16, color: "#EEEEEE", marginLeft: 10 },
  sectionText: { fontSize: 15, color: "#EEEEEE", lineHeight: 22 },
});

export default HomePage;
