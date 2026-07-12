import Constants from "expo-constants";
import type { AppVersionDto } from "../domain/dtos/AppVersionDto";

export function getFrontendBuildInfo(): AppVersionDto {
  const extra = Constants.expoConfig?.extra ?? {};

  return {
    applicationName: "Frontend",
    version:
      typeof extra.appVersion === "string" && extra.appVersion.trim()
        ? extra.appVersion.trim()
        : "0.2.2",
    commitSha:
      typeof extra.appCommitSha === "string" && extra.appCommitSha.trim()
        ? extra.appCommitSha.trim()
        : null,
    branch:
      typeof extra.appBranch === "string" && extra.appBranch.trim()
        ? extra.appBranch.trim()
        : null,
    buildTimeUtc:
      typeof extra.appBuildTimeUtc === "string" && extra.appBuildTimeUtc.trim()
        ? extra.appBuildTimeUtc.trim()
        : null
  };
}
