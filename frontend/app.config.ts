import type { ExpoConfig } from "expo/config";

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
    apiBaseUrl: "http://localhost:5080"
  }
};

export default config;

