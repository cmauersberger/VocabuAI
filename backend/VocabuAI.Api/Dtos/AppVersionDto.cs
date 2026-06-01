namespace VocabuAI.Api.Dtos;

// Keep in sync with frontend/src/domain/dtos/AppVersionDto.ts

public sealed record AppVersionDto(
    string ApplicationName,
    string Version,
    string? CommitSha,
    string? Branch,
    DateTimeOffset? BuildTimeUtc
);
