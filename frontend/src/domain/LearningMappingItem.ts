// Keep in sync with backend/VocabuAI.Domain/LearningMappingItem.cs
import type { LearningText } from "./LearningText";

export type LearningMappingItem = {
  flashCardId: number;
  left: LearningText;
  right: LearningText;
};
