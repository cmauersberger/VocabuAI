import { Platform } from "react-native";

const WEB_DEV_API_BASE_URL = "http://localhost:5080";

export const getApiBaseUrl = (): string => {
  if (Platform.OS === "web" && typeof __DEV__ !== "undefined" && __DEV__) {
    return WEB_DEV_API_BASE_URL;
  }

  const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE;
  if (!apiBaseUrl) {
    throw new Error("EXPO_PUBLIC_API_BASE is not set.");
  }

  return apiBaseUrl;
};
