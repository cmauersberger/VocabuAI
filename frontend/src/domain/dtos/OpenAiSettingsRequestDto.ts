// Keep in sync with backend/VocabuAI.Api/Dtos/OpenAiSettingsRequestDto.cs
export type OpenAiSettingsRequestDto = {
  openAiApiKey: string;
  openAiMonthlyTokenLimit: number;
  userTimeZone: string | null;
};
