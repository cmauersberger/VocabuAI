import type { ExpoConfig } from "expo/config";

declare const process: {
  env?: Record<string, string | undefined>;
};

const apiBaseUrl = process.env?.EXPO_PUBLIC_API_BASE ?? "http://localhost:5080";
const appVersion = process.env?.APP_VERSION ?? "0.2.2";
const appCommitSha = process.env?.APP_COMMIT_SHA ?? "local";
const appBuildTimeUtc = process.env?.APP_BUILD_TIME_UTC ?? "";
const appBranch = process.env?.APP_BRANCH ?? "local";

const config: ExpoConfig = {
  name: "VocabuAI",
  slug: "vocabuai",
  version: appVersion,
  orientation: "portrait",
  platforms: ["android", "web"],
  scheme: "vocabuai",
  plugins: [
    [
      "expo-audio",
      {
        microphonePermission: false,
        recordAudioAndroid: false
      }
    ]
  ],
  web: {
    bundler: "metro",
    output: "single"
  },
  android: {
    package: "com.example.vocabuai"
  },
  extra: {
    apiBaseUrl,
    appVersion,
    appCommitSha,
    appBuildTimeUtc,
    appBranch
  }
};

export default config;
