import dynamic from "next/dynamic";
import { Platform } from "react-native";

const MapPicker = dynamic(
  () =>
    Platform.OS === "web"
      ? import("./MapPickerWeb")
      : import("./MapPickerMobile"),
  { ssr: false }
);

export default MapPicker;
