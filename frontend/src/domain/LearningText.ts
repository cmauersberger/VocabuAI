// Keep in sync with backend/VocabuAI.Domain/LearningText.cs
import type { LearningLanguage } from "./LearningLanguage";

export type LearningText = {
  language: LearningLanguage;
  value: string;
};
