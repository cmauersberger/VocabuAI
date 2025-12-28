import { LearningTaskType } from "../LearningTaskType";

// Keep in sync with backend/VocabuAI.Api/Dtos/FlashCardLearningStateDto.cs
export type FlashCardLearningStateDto = {
  id: number;
  flashCardId: number;
  box: number;
  progressPointsInCurrentBox: number;
  correctCountsByQuestionTypeInCurrentBox: Record<LearningTaskType, number>;
  correctCountTotal: number;
  wrongCountTotal: number;
  correctStreak: number;
  lastAnsweredAt: string | null;
};
