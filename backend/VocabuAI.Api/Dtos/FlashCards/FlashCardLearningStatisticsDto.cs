namespace VocabuAI.Api.Dtos.FlashCards;

// Keep in sync with frontend/src/domain/dtos/flashcards/FlashCardLearningStatisticsDto.ts

public sealed record FlashCardLearningStatisticsDto(
    int CorrectCountTotal,
    int WrongCountTotal,
    DateTimeOffset? LastAnsweredAt
);
