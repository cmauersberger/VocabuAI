// Keep in sync with backend/VocabuAI.Api/Dtos/FlashCards/FlashCardImportResultDto.cs
export type FlashCardImportResultDto = {
  importedFlashcardsCount: number;
  importedLearningStatesCount: number;
  errors: string[];
};
