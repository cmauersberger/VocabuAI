namespace VocabuAI.Api.Dtos;

// Keep in sync with frontend/src/domain/dtos/OpenAiSettingsRequestDto.ts

public sealed record OpenAiSettingsRequestDto(
    string OpenAiApiKey,
    int OpenAiMonthlyTokenLimit
);
