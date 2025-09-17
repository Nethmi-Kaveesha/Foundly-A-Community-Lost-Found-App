"use client";

import { db, storage } from "@/firebase";
import * as ImagePicker from "expo-image-picker";
import {
  EmailAuthProvider,
  getAuth,
  reauthenticateWithCredential,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ProfileScreen = () => {
  const auth = getAuth();
  const user = auth.currentUser;

  const [name, setName] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [photoURL, setPhotoURL] = useState(user?.photoURL || "");
  const [loading, setLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  // Fetch user profile from Firestore
  useEffect(() => {
    if (!user) return;
    const fetchUser = async () => {
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setName(data.name || user.displayName || "");
          setPhotoURL(data.photoURL || user.photoURL || "");
          setDarkMode(data.darkMode || false);
          setNotifications(data.notifications ?? true);
        }
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Failed to fetch profile data");
      }
    };
    fetchUser();
  }, [user]);

  // Pick image from gallery
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets.length > 0) {
        setPhotoURL(result.assets[0].uri);
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  // Upload image to Firebase Storage
  const uploadImage = async (uri: string, uid: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const imageRef = ref(storage, `avatars/${uid}`);
    await uploadBytes(imageRef, blob);
    return getDownloadURL(imageRef);
  };

  // Save profile changes
  const handleSave = async () => {
    if (!user) return;
    setLoading(true);

    try {
      let uploadedPhotoURL = photoURL;

      // Upload avatar if local
      if (photoURL && !photoURL.startsWith("https://")) {
        uploadedPhotoURL = await uploadImage(photoURL, user.uid);
      }

      // Update Auth profile
      await updateProfile(user, { displayName: name, photoURL: uploadedPhotoURL });

      // Update Firestore user doc
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        name,
        photoURL: uploadedPhotoURL,
        darkMode,
        notifications,
      });

      // Change password if requested
      if (newPassword) {
        if (!currentPassword) {
          Alert.alert("Error", "Please enter your current password");
          setLoading(false);
          return;
        }
        if (newPassword !== confirmPassword) {
          Alert.alert("Error", "New password and confirm password do not match");
          setLoading(false);
          return;
        }
        const credential = EmailAuthProvider.credential(user.email!, currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
      }

      Alert.alert("Success", "Profile updated successfully!");
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/wrong-password") {
        Alert.alert("Error", "Current password is incorrect");
      } else if (err.code === "auth/requires-recent-login") {
        Alert.alert(
          "Error",
          "Please log out and log in again before changing sensitive info like password."
        );
      } else {
        Alert.alert("Error", "Failed to update profile");
      }
    } finally {
      setLoading(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  if (!user) return <Text style={{ padding: 20 }}>No user logged in</Text>;

  return (
    <SafeAreaView style={[styles.container, darkMode && { backgroundColor: "#1F2937" }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={[styles.title, darkMode && { color: "#F9FAFB" }]}>My Profile</Text>

        <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
          <Image
            source={
              photoURL
                ? { uri: photoURL }
                : require("../assets/default-avatar.png") // Ensure this exists
            }
            style={styles.avatar}
          />
          <Text style={styles.changePhotoText}>Change Photo</Text>
        </TouchableOpacity>

        <Text style={[styles.label, darkMode && { color: "#F9FAFB" }]}>Name</Text>
        <TextInput
          style={[styles.input, darkMode && { backgroundColor: "#374151", color: "#F9FAFB" }]}
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
          placeholderTextColor={darkMode ? "#9CA3AF" : "#6B7280"}
        />

        <Text style={[styles.label, darkMode && { color: "#F9FAFB" }]}>Email</Text>
        <TextInput
          style={[styles.input, { backgroundColor: "#E5E7EB", color: "#6B7280" }]}
          value={email}
          editable={false}
        />

        <Text style={[styles.sectionTitle, darkMode && { color: "#F9FAFB" }]}>Change Password</Text>

        {/* Current Password */}
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, darkMode && { backgroundColor: "#374151", color: "#F9FAFB" }]}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Current Password"
            secureTextEntry={!showCurrent}
            placeholderTextColor={darkMode ? "#9CA3AF" : "#6B7280"}
          />
          <Pressable
            style={styles.showHideButton}
            onPress={() => setShowCurrent(!showCurrent)}
          >
            <Text style={styles.showHideText}>{showCurrent ? "Hide" : "Show"}</Text>
          </Pressable>
        </View>

        {/* New Password */}
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, darkMode && { backgroundColor: "#374151", color: "#F9FAFB" }]}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="New Password"
            secureTextEntry={!showNew}
            placeholderTextColor={darkMode ? "#9CA3AF" : "#6B7280"}
          />
          <Pressable
            style={styles.showHideButton}
            onPress={() => setShowNew(!showNew)}
          >
            <Text style={styles.showHideText}>{showNew ? "Hide" : "Show"}</Text>
          </Pressable>
        </View>

        {/* Confirm Password */}
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, darkMode && { backgroundColor: "#374151", color: "#F9FAFB" }]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm New Password"
            secureTextEntry={!showConfirm}
            placeholderTextColor={darkMode ? "#9CA3AF" : "#6B7280"}
          />
          <Pressable
            style={styles.showHideButton}
            onPress={() => setShowConfirm(!showConfirm)}
          >
            <Text style={styles.showHideText}>{showConfirm ? "Hide" : "Show"}</Text>
          </Pressable>
        </View>

        <View style={styles.toggleRow}>
          <Text style={[styles.toggleText, darkMode && { color: "#F9FAFB" }]}>Dark Mode</Text>
          <Switch value={darkMode} onValueChange={setDarkMode} />
        </View>

        <View style={styles.toggleRow}>
          <Text style={[styles.toggleText, darkMode && { color: "#F9FAFB" }]}>Notifications</Text>
          <Switch value={notifications} onValueChange={setNotifications} />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Profile</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#222831" }, // dark background
  scrollContainer: { padding: 20 },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 20, color: "#EEEEEE" },
  avatarContainer: { alignItems: "center", marginBottom: 20 },
  avatar: { width: 120, height: 120, borderRadius: 60, backgroundColor: "#393E46" },
  changePhotoText: { marginTop: 8, color: "#00ADB5", fontWeight: "600" },
  label: { fontSize: 16, fontWeight: "600", marginBottom: 6, color: "#EEEEEE" },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginTop: 20, marginBottom: 8, color: "#EEEEEE" },
  input: { backgroundColor: "#393E46", padding: 12, borderRadius: 12, fontSize: 16, marginBottom: 16, color: "#EEEEEE" },
  passwordContainer: { position: "relative" },
  showHideButton: { position: "absolute", right: 18, top: 14 },
  showHideText: { color: "#00ADB5", fontWeight: "600" },
  toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  toggleText: { fontSize: 16, fontWeight: "600", color: "#EEEEEE" },
  saveButton: {
    backgroundColor: "#00ADB5",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    // shadow for iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    // shadow for Android
    elevation: 6,
  },
  saveButtonText: { color: "#222831", fontWeight: "700", fontSize: 16 },
});
