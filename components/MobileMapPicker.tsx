import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import type { Coord } from "./types";

interface Props {
  location?: Coord;
  onLocationSelect: (loc: Coord) => void;
}

const MobileMapPicker: React.FC<Props> = ({ location, onLocationSelect }) => {
  // Web fallback
  if (Platform.OS === "web") {
    return (
      <View style={styles.webContainer}>
        <Text>Map not supported on web. Enter location manually.</Text>
      </View>
    );
  }

  // Dynamically import react-native-maps only on native
  const MapView = require("react-native-maps").default;
  const Marker = require("react-native-maps").Marker;

  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: location?.latitude || 37.78825,
        longitude: location?.longitude || -122.4324,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }}
      onPress={(e: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => {
        const { latitude, longitude } = e.nativeEvent.coordinate;
        onLocationSelect({ latitude, longitude });
      }}
    >
      {location && <Marker coordinate={location} />}
    </MapView>
  );
};

export default MobileMapPicker;

const styles = StyleSheet.create({
  map: {
    height: 250,
    width: "100%",
    borderRadius: 12,
    marginBottom: 16,
  },
  webContainer: {
    height: 250,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#eee",
    borderRadius: 12,
    marginBottom: 16,
  },
});
