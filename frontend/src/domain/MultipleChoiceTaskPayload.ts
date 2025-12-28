// Keep in sync with backend/VocabuAI.Domain/MultipleChoiceTaskPayload.cs
import type { LearningAnswerOption } from "./LearningAnswerOption";
import type { LearningSelectionMode } from "./LearningSelectionMode";
import type { LearningText } from "./LearningText";

export type MultipleChoiceTaskPayload = {
  flashCardId: number;
  selectionMode: LearningSelectionMode;
  question: LearningText;
  options: LearningAnswerOption[];
};
