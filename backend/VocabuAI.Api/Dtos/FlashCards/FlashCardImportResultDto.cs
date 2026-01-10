namespace VocabuAI.Api.Dtos.FlashCards;

// Keep in sync with frontend/src/domain/dtos/flashcards/FlashCardImportResultDto.ts
public sealed record FlashCardImportResultDto(
    int ImportedFlashcardsCount,
    int ImportedLearningStatesCount,
    List<string> Errors
);
