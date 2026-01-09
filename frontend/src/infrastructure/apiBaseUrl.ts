import Constants from "expo-constants";

export const getApiBaseUrl = (): string => {
  const apiBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl;
  if (!apiBaseUrl || typeof apiBaseUrl !== "string") {
    throw new Error("apiBaseUrl is not configured. Set EXPO_PUBLIC_API_BASE.");
  }

  const trimmed = apiBaseUrl.trim().replace(/\/+$/, "");
  if (!trimmed) {
    throw new Error("apiBaseUrl is empty. Set EXPO_PUBLIC_API_BASE.");
  }

  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
};
