// Keep in sync with backend/VocabuAI.Domain/LearningSession.cs
import type { LearningTask } from "./LearningTask";

export type LearningSession = {
  guid: string;
  userId: number;
  createdAt: string;
  tasks: LearningTask[];
};
