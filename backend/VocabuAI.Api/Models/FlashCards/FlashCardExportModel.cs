namespace VocabuAI.Api.Models.FlashCards;

public sealed record FlashCardExportModel(
    string ForeignLanguage,
    string LocalLanguage,
    string ForeignLanguageCode,
    string LocalLanguageCode,
    string? Synonyms,
    string? Annotation
);
