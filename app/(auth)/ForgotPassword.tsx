import { forgotPassword } from "@/services/authService";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const ForgotPassword = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async () => {
    if (!email) {
      Alert.alert("Validation Error", "Please enter your email");
      return;
    }

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      Alert.alert("Validation Error", "Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      const res = await forgotPassword(email);
      console.log("Forgot password response:", res);

      Alert.alert(
        "Success",
        "If this email exists in our system, a reset link has been sent."
      );

      router.push("./Login"); // Navigate back to login
    } catch (err) {
      console.error("Forgot password error:", err);
      Alert.alert(
        "Error",
        "Cannot reach backend. Check your network or server status."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>
      <Text style={styles.subtitle}>
        Enter your email to receive a reset link.
      </Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />

      <TouchableOpacity onPress={handleReset} style={styles.button}>
        {isLoading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.buttonText}>Send Reset Link</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F9FAFB",
  },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 8, color: "#8B5CF6" },
  subtitle: { fontSize: 16, marginBottom: 24, color: "#6B7280", textAlign: "center" },
  input: {
    width: "100%",
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    width: "100%",
    backgroundColor: "#8B5CF6",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  buttonText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
});

export default ForgotPassword;
