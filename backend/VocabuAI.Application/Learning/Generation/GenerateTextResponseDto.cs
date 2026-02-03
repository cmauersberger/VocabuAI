using VocabuAI.Application.Learning.Generation.Contracts;

namespace VocabuAI.Application.Learning.Generation;

// Keep in sync with frontend/src/domain/dtos/GenerateTextResponseDto.ts

public sealed record GenerateTextResponseDto(
    Language Language,
    string Text,
    bool IsValid,
    string? ErrorMessage,
    AiProvider Provider,
    AiTokenUsage? TokenUsage,
    double? UsagePercent
);
