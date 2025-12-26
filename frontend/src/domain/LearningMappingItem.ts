// Keep in sync with backend/VocabuAI.Domain/LearningMappingItem.cs
import type { LearningText } from "./LearningText";

export type LearningMappingItem = {
  left: LearningText;
  right: LearningText;
};
