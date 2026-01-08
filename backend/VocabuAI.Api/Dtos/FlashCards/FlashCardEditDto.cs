namespace VocabuAI.Api.Dtos.FlashCards;

// Keep in sync with frontend/src/domain/dtos/flashcards/FlashCardEditDto.ts

public sealed record FlashCardEditDto(
    int Id,
    string ForeignLanguage,
    string LocalLanguage,
    string ForeignLanguageCode,
    string LocalLanguageCode,
    string? Synonyms,
    string? Annotation
);
