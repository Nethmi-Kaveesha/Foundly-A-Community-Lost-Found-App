"use client";

import { createOrGetChat, getMessagesQuery, sendMessage } from "@/services/chatService";
import { getAuth } from "firebase/auth";
import { onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

interface ChatScreenProps {
  otherUserId: string; // The person you are messaging
}

const ChatScreen = ({ otherUserId }: ChatScreenProps) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [chatId, setChatId] = useState<string>("");

  useEffect(() => {
    if (!currentUser) return;

    const initChat = async () => {
      const chatRef = await createOrGetChat(currentUser.uid, otherUserId);
      setChatId(chatRef.id);

      const messagesQuery = getMessagesQuery(chatRef.id);
      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const msgs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setMessages(msgs);
      });

      return unsubscribe;
    };

    initChat();
  }, [currentUser]);

  const handleSend = async () => {
    if (!text.trim() || !chatId || !currentUser) return;
    await sendMessage(chatId, currentUser.uid, text.trim());
    setText("");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={80}
    >
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.messageBubble, item.senderId === currentUser?.uid ? styles.myMessage : styles.theirMessage]}>
            <Text style={{ color: "#fff" }}>{item.text}</Text>
          </View>
        )}
        contentContainerStyle={{ padding: 12 }}
      />

      <View style={styles.inputContainer}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
          style={styles.input}
        />
        <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
          <Text style={{ color: "#fff", fontWeight: "bold" }}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  inputContainer: { flexDirection: "row", padding: 10, backgroundColor: "#fff", borderTopWidth: 1, borderColor: "#D1D5DB" },
  input: { flex: 1, backgroundColor: "#E5E7EB", padding: 12, borderRadius: 20, marginRight: 10 },
  sendButton: { backgroundColor: "#8B5CF6", borderRadius: 20, paddingHorizontal: 20, justifyContent: "center" },
  messageBubble: { padding: 12, borderRadius: 16, marginBottom: 8, maxWidth: "70%" },
  myMessage: { backgroundColor: "#8B5CF6", alignSelf: "flex-end" },
  theirMessage: { backgroundColor: "#10B981", alignSelf: "flex-start" },
});
