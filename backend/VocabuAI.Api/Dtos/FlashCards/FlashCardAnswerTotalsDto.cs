namespace VocabuAI.Api.Dtos.FlashCards;

// Keep in sync with frontend/src/domain/dtos/flashcards/FlashCardAnswerTotalsDto.ts

public sealed record FlashCardAnswerTotalsDto(
    int CorrectCountTotal,
    int WrongCountTotal
);
