// Keep in sync with backend/VocabuAI.Domain/FreeTextTaskPayload.cs
import type { LearningAnswerOption } from "./LearningAnswerOption";
import type { LearningText } from "./LearningText";

export type FreeTextTaskPayload = {
  flashCardId: number;
  question: LearningText;
  answers: LearningAnswerOption[];
};
