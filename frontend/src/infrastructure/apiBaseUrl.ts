import Constants from "expo-constants";
import { Platform } from "react-native";

const DEV_WEB_API_BASE_URL = "http://localhost:5080/api";

export const getApiBaseUrl = (): string => {
  if (Platform.OS === "web" && typeof __DEV__ !== "undefined" && __DEV__) {
    return DEV_WEB_API_BASE_URL;
  }

  const apiBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl;
  if (!apiBaseUrl || typeof apiBaseUrl !== "string") {
    throw new Error("apiBaseUrl is not configured. Set EXPO_PUBLIC_API_BASE.");
  }

  return normalizeApiBase(apiBaseUrl);
};

const normalizeApiBase = (value: string): string => {
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) {
    throw new Error("apiBaseUrl is empty. Set EXPO_PUBLIC_API_BASE.");
  }

  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
};
