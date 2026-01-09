import type { ExpoConfig } from "expo/config";

declare const process: {
  env?: Record<string, string | undefined>;
};

const apiBaseUrl = process.env?.EXPO_PUBLIC_API_BASE ?? "http://localhost:5080";

const config: ExpoConfig = {
  name: "VocabuAI",
  slug: "vocabuai",
  version: "0.1.0",
  orientation: "portrait",
  platforms: ["android", "web"],
  scheme: "vocabuai",
  web: {
    bundler: "metro",
    output: "single"
  },
  android: {
    package: "com.example.vocabuai"
  },
  extra: {
    apiBaseUrl
  }
};

export default config;
