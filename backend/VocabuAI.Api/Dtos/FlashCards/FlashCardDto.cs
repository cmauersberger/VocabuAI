namespace VocabuAI.Api.Dtos.FlashCards;

// Keep in sync with frontend/src/domain/dtos/flashcards/FlashCardDto.ts

public sealed record FlashCardDto(
    int Id,
    string ForeignLanguage,
    string LocalLanguage,
    string? Synonyms,
    string? Annotation,
    DateTimeOffset DateTimeCreated,
    DateTimeOffset DateTimeUpdated
);
