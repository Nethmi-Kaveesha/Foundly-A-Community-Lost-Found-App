"use client";
import { Notification, useNotifications } from "@/hooks/useNotifications";
import { getAuth } from "firebase/auth";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

const NotificationsScreen = () => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  // Only run if user is logged in
  const notifications: Notification[] = currentUser ? useNotifications(currentUser.uid) : [];

  return (
    <ScrollView style={styles.container}>
      {notifications.length === 0 ? (
        <Text style={styles.noNotifText}>No notifications yet</Text>
      ) : (
        notifications.map((notif) => (
          <View key={notif.id} style={styles.notifCard}>
            <Text style={styles.title}>{notif.title}</Text>
            <Text style={styles.message}>{notif.message}</Text>
            <Text style={styles.date}>{notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleString() : ""}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
};

export default NotificationsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f9f9f9" },
  notifCard: { padding: 12, marginBottom: 12, borderRadius: 8, backgroundColor: "#fff", shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 5 },
  title: { fontWeight: "bold", fontSize: 16, marginBottom: 4 },
  message: { fontSize: 14, marginBottom: 4 },
  date: { fontSize: 12, color: "#999" },
  noNotifText: { textAlign: "center", marginTop: 20, color: "#666" },
});
