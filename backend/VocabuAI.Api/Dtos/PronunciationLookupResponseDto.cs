namespace VocabuAI.Api.Dtos;

// Keep in sync with frontend/src/domain/dtos/PronunciationLookupResponseDto.ts

public sealed record PronunciationLookupResponseDto(
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
