// Keep in sync with backend/VocabuAI.Application/Learning/Generation/GenerateTextResponseDto.cs
import { Language } from "../Language";
import type { AiProvider } from "../AiProvider";

export type GenerateTextResponseDto = {
  language: Language;
  text: string;
  isValid: boolean;
  errorMessage: string | null;
  provider: AiProvider;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  } | null;
  usagePercent: number | null;
};
