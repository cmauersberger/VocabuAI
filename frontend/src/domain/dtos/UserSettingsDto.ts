// Keep in sync with backend/VocabuAI.Api/Dtos/UserSettingsDto.cs
import type { AiProvider } from "../AiProvider";

export type UserSettingsDto = {
  defaultForeignFlashCardLanguage: string;
  defaultLocalFlashCardLanguage: string;
  hasOpenAiKey: boolean;
  openAiKeyLast4: string | null;
  openAiMonthlyTokenLimit: number;
  openAiTokensUsedThisMonth: number;
  monthKey: string;
  usagePercent: number | null;
  lastSelectedAiProvider: AiProvider;
};
