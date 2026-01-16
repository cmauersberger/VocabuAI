// Keep in sync with backend/VocabuAI.Application/Learning/Generation/GenerateTextResponseDto.cs
import { Language } from "../Language";

export type GenerateTextResponseDto = {
  language: Language;
  text: string;
  isValid: boolean;
  errorMessage: string | null;
};
