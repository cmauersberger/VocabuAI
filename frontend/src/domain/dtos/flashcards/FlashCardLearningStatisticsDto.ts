// Keep in sync with backend/VocabuAI.Api/Dtos/FlashCards/FlashCardLearningStatisticsDto.cs
export type FlashCardLearningStatisticsDto = {
  correctCountTotal: number;
  wrongCountTotal: number;
  lastAnsweredAt?: string | null;
};
