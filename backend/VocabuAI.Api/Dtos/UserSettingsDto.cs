using VocabuAI.Application.Learning.Generation.Contracts;

namespace VocabuAI.Api.Dtos;

// Keep in sync with frontend/src/domain/dtos/UserSettingsDto.ts

public sealed record UserSettingsDto(
    string DefaultForeignFlashCardLanguage,
    string DefaultLocalFlashCardLanguage,
    bool HasOpenAiKey,
    string? OpenAiKeyLast4,
    int OpenAiMonthlyTokenLimit,
    int OpenAiTokensUsedThisMonth,
    string MonthKey,
    double? UsagePercent,
    AiProvider LastSelectedAiProvider
);
