import { useAuth } from "@/context/AuthContext";
import { login } from "@/services/authService";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const Login = () => {
  const router = useRouter();
  const { setUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Validation Error", "Email and password are required");
      return;
    }
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      Alert.alert("Validation Error", "Please enter a valid email address");
      return;
    }

    if (isLoading) return;
    setIsLoading(true);

    try {
      const res = await login(email, password);
      setUser(res.user);
      router.push("/home");
      Alert.alert("Success", "Logged in successfully!");
    } catch (err) {
      console.error(err);
      const error = err as { response?: { data?: { message?: string } } };
      const message =
        error.response?.data?.message || "Something went wrong. Please try again.";
      Alert.alert("Login Failed", message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <LinearGradient
      colors={["#EEEEEE", "#222831", "#393E46", "#00ADB5"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <Animated.View
          style={[
            styles.card,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Brand */}
          <Text style={styles.title}>Foundly</Text>
          <Text style={styles.subtitle}>A Community Lost & Found App</Text>
          <Text style={styles.sectionTitle}>Log in to your account</Text>

          {/* Email Input */}
          <View
            style={[
              styles.inputContainer,
              { borderColor: emailFocused ? "#00ADB5" : "#00ADB5" },
            ]}
          >
            <Ionicons name="mail-outline" size={20} color="#00ADB5" style={styles.icon} />
            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
            />
          </View>

          {/* Password Input */}
          <View
            style={[
              styles.inputContainer,
              { borderColor: passwordFocused ? "#00ADB5" : "#00ADB5" },
            ]}
          >
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color="#00ADB5"
              style={styles.icon}
            />
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
            />
            <Pressable
              style={styles.showHideButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={22}
                color="#00ADB5"
              />
            </Pressable>
          </View>

          {/* Options */}
          <View style={styles.optionsRow}>
            <View style={styles.rememberMe}>
              <Switch
                value={rememberMe}
                onValueChange={setRememberMe}
                thumbColor={rememberMe ? "#00ADB5" : "#EEEEEE"}
                trackColor={{ false: "#393E46", true: "#00ADB5" }}
              />
              <Text style={styles.rememberMeText}>Remember me</Text>
            </View>

            <Pressable onPress={() => router.push("./ForgotPassword")}>
              <Text style={styles.forgotPassword}>Forgot password?</Text>
            </Pressable>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            onPress={handleLogin}
            style={styles.loginButton}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="large" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Sign Up Link */}
          <Pressable onPress={() => router.push("/register")} style={styles.registerContainer}>
            <Text style={styles.registerText}>
              Don't have an account?{" "}
              <Text style={styles.registerLink}>Sign up</Text>
            </Text>
          </Pressable>

          {/* Terms & Stats */}
          <Text style={styles.tosText}>
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </Text>

          <Text style={styles.statsText}>
            ● <Text style={{ color: "#00ADB5", fontWeight: "700" }}>2,458</Text> items found this month
          </Text>
        </Animated.View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "rgba(255, 255, 255, 0.1)", // more transparent
    borderRadius: 24,
    padding: 32,
    shadowColor: "#00ADB5",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#00ADB5",
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#222831",
    marginBottom: 24,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#222831",
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: "#222831",
  },
  showHideButton: {
    padding: 4,
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  rememberMe: {
    flexDirection: "row",
    alignItems: "center",
  },
  rememberMeText: {
    marginLeft: 8,
    color: "#222831",
    fontSize: 14,
  },
  forgotPassword: {
    color: "#00ADB5",
    fontSize: 14,
    fontWeight: "600",
  },
  loginButton: {
    width: "100%",
    backgroundColor: "#00ADB5",
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#00ADB5",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 1,
  },
  registerContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  registerText: {
    fontSize: 16,
    color: "#222831",
  },
  registerLink: {
    color: "#00ADB5",
    fontWeight: "700",
  },
  tosText: {
    fontSize: 12,
    color: "#393E46",
    textAlign: "center",
    marginBottom: 12,
  },
  statsText: {
    fontSize: 14,
    color: "#222831",
    textAlign: "center",
  },
});

export default Login;
