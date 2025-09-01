import { useAuth } from "@/context/AuthContext";
import { login } from "@/services/authService";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
      Alert.alert("Success", "Logged in successfully!", [
        { text: "OK", onPress: () => router.push("/home") },
      ]);
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.card}>
        {/* Brand Name & Tagline */}
        <Text style={styles.title}>Foundly</Text>
        <Text style={styles.subtitle}>A Community Lost & Found App</Text>
        <Text style={styles.sectionTitle}>Log in to your account</Text>

        {/* Email Input */}
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
        />

        {/* Password Input */}
        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            placeholderTextColor="#9CA3AF"
            style={styles.input}
          />
          <Pressable
            style={styles.showHideButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={styles.showHideText}>
              {showPassword ? "Hide" : "Show"}
            </Text>
          </Pressable>
        </View>

        {/* Remember Me & Forgot Password */}
        <View style={styles.optionsRow}>
          <View style={styles.rememberMe}>
            <Switch
              value={rememberMe}
              onValueChange={setRememberMe}
              thumbColor={rememberMe ? "#8B5CF6" : "#f4f3f4"}
              trackColor={{ false: "#D1D5DB", true: "#C4B5FD" }}
            />
            <Text style={styles.rememberMeText}>Remember me</Text>
          </View>

          <Pressable onPress={() => Alert.alert("Forgot Password", "Password reset flow")}>
            <Text style={styles.forgotPassword}>Forgot your password?</Text>
          </Pressable>
        </View>

        {/* Login Button */}
        <TouchableOpacity onPress={handleLogin} style={styles.loginButton}>
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="large" />
          ) : (
            <Text style={styles.loginButtonText}>Sign in</Text>
          )}
        </TouchableOpacity>

        {/* Sign Up Link */}
        <Pressable onPress={() => router.push("/register")} style={styles.registerContainer}>
          <Text style={styles.registerText}>
            Don't have an account? <Text style={styles.registerLink}>Sign up</Text>
          </Text>
        </Pressable>

        {/* Terms & Privacy */}
        <Text style={styles.tosText}>
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </Text>

        {/* Items Found */}
        <Text style={styles.statsText}>● 2,458 items found this month</Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#8B5CF6",
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 16,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  input: {
    width: "100%",
    backgroundColor: "#F3F4F6",
    borderColor: "#D1D5DB",
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 16,
    color: "#111827",
    marginBottom: 16,
  },
  passwordContainer: {
    position: "relative",
  },
  showHideButton: {
    position: "absolute",
    right: 18,
    top: 16,
  },
  showHideText: {
    color: "#8B5CF6",
    fontWeight: "600",
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
    color: "#111827",
    fontSize: 14,
  },
  forgotPassword: {
    color: "#8B5CF6",
    fontSize: 14,
    fontWeight: "600",
  },
  loginButton: {
    width: "100%",
    backgroundColor: "#8B5CF6",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 16,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  registerContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  registerText: {
    fontSize: 16,
    color: "#6B7280",
  },
  registerLink: {
    color: "#F59E0B",
    fontWeight: "700",
  },
  tosText: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 12,
  },
  statsText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
});

export default Login;
