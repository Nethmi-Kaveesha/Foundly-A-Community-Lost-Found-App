import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const Welcome = () => {
  const router = useRouter();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(logoAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <LinearGradient
      colors={['#222831', '#393E46', '#00ADB5', '#EEEEEE']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Glows for depth */}
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={Platform.OS === "android"}
      />

      {/* Top Section */}
      <Animated.View style={[styles.topSection, { opacity: logoAnim }]}>
        <Image
          source={require("./assets/images/welcome.png")}
          style={styles.image}
          resizeMode="contain"
        />
        <Text style={styles.title}>Foundly</Text>
        <Text style={styles.subtitle}>A Community Lost & Found App</Text>
      </Animated.View>

      {/* Bottom Section */}
      <Animated.View style={[styles.bottomSection, { opacity: fadeAnim }]}>
        {/* Primary Button */}
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.push("/login")}
        >
          <Text style={styles.loginButtonText}>Log In</Text>
        </TouchableOpacity>

        {/* Secondary Button */}
        <TouchableOpacity
          style={styles.signupButton}
          onPress={() => router.push("/register")}
        >
          <Text style={styles.signupButtonText}>Sign Up</Text>
        </TouchableOpacity>
      </Animated.View>

      <Text style={styles.footerText}>
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  glowTop: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 400,
    height: 400,
    backgroundColor: 'rgba(0,173,181,0.12)',
    borderRadius: 200,
    transform: [{ rotate: '45deg' }],
  },
  glowBottom: {
    position: 'absolute',
    bottom: -120,
    right: -80,
    width: 300,
    height: 300,
    backgroundColor: 'rgba(238,238,238,0.08)',
    borderRadius: 150,
  },
  topSection: { flex: 3, justifyContent: "center", alignItems: "center" ,  marginTop: 100},
  image: { width: 200, height: 200, marginBottom: 4 },
  title: { fontSize: 36, fontWeight: "bold", color: "#EEEEEE", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#EEEEEE", textAlign: "center" },
  bottomSection: { flex: 2, width: "100%", justifyContent: "center", alignItems: "center", marginTop: 4 },
  
  // Primary button (Log In)
  loginButton: {
    width: "100%",
    backgroundColor: "#00ADB5",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6
  },
  loginButtonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },

  // Secondary button (Sign Up)
  signupButton: {
    width: "100%",
    backgroundColor: "#EEEEEE",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  signupButtonText: { color: "#00ADB5", fontSize: 18, fontWeight: "700" },

  footerText: { marginTop: 24, fontSize: 12, color: "#EEEEEE", textAlign: "center" },
});

export default Welcome;
