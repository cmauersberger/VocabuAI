namespace VocabuAI.Application.Pronunciation;

public sealed record PronunciationLookupResult(
    string Term,
    string LanguageCode,
    bool IsAvailable,
    string? AudioUrl,
    string? AttributionUrl,
    string? LicenseShortName,
    string? Creator,
    string? Credit,
    string? Source,
    string? Message
);
