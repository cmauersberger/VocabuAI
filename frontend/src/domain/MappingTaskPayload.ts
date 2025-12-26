// Keep in sync with backend/VocabuAI.Domain/MappingTaskPayload.cs
import type { LearningMappingItem } from "./LearningMappingItem";

export type MappingTaskPayload = {
  items: LearningMappingItem[];
};
