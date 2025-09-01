import { register } from "@/services/authService";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const Register = () => {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [cPassword, setCPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCPassword, setShowCPassword] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !cPassword) {
      Alert.alert("Validation Error", "All fields are required.");
      return;
    }

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      Alert.alert("Validation Error", "Please enter a valid email address.");
      return;
    }

    if (password !== cPassword) {
      Alert.alert("Validation Error", "Passwords do not match.");
      return;
    }

    if (isLoading) return;
    setIsLoading(true);

    try {
      await register(email, password);
      Alert.alert("Success", "Account created successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      console.error(err);
      Alert.alert("Registration Failed", "Something went wrong. Please try again.");
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
        <Text style={styles.title}>Foundly</Text>
        <Text style={styles.subtitle}>A Community Lost & Found App</Text>
        <Text style={styles.sectionTitle}>Create your account</Text>

        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
        />

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
            <Text style={styles.showHideText}>{showPassword ? "Hide" : "Show"}</Text>
          </Pressable>
        </View>

        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Confirm Password"
            value={cPassword}
            onChangeText={setCPassword}
            secureTextEntry={!showCPassword}
            placeholderTextColor="#9CA3AF"
            style={styles.input}
          />
          <Pressable
            style={styles.showHideButton}
            onPress={() => setShowCPassword(!showCPassword)}
          >
            <Text style={styles.showHideText}>{showCPassword ? "Hide" : "Show"}</Text>
          </Pressable>
        </View>

        <TouchableOpacity onPress={handleRegister} style={styles.registerButton}>
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="large" />
          ) : (
            <Text style={styles.registerButtonText}>Sign Up</Text>
          )}
        </TouchableOpacity>

        <Pressable onPress={() => router.back()} style={styles.loginContainer}>
          <Text style={styles.loginText}>
            Already have an account? <Text style={styles.loginLink}>Login</Text>
          </Text>
        </Pressable>
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
    fontWeight: "600", // string instead of number
  },
  registerButton: {
    width: "100%",
    backgroundColor: "#8B5CF6",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 16,
  },
  registerButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  loginContainer: {
    alignItems: "center",
  },
  loginText: {
    fontSize: 16,
    color: "#6B7280",
  },
  loginLink: {
    color: "#F59E0B",
    fontWeight: "700",
  },
});

export default Register;
