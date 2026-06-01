// Keep in sync with backend/VocabuAI.Api/Dtos/AppVersionDto.cs
export type AppVersionDto = {
  applicationName: string;
  version: string;
  commitSha: string | null;
  branch: string | null;
  buildTimeUtc: string | null;
};
