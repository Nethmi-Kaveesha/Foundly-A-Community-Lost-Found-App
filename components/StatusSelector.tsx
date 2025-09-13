import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface Props {
  status: "Lost" | "Found";
  setStatus: (s: "Lost" | "Found") => void;
}

const StatusSelector: React.FC<Props> = ({ status, setStatus }) => {
  return (
    <View style={{ flexDirection: "row", marginBottom: 12, backgroundColor: "#E5E7EB", borderRadius: 12 }}>
      {(["Lost", "Found"] as const).map((s) => (
        <TouchableOpacity
          key={s}
          onPress={() => setStatus(s)}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderRadius: 12,
            backgroundColor: status === s ? (s === "Lost" ? "#3B82F6" : "#10B981") : "transparent",
          }}
        >
          <Text style={{ textAlign: "center", fontWeight: "600", color: status === s ? "#fff" : "#374151" }}>{s}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default StatusSelector;
