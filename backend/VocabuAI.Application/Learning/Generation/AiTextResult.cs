using VocabuAI.Application.Learning.Generation.Contracts;

namespace VocabuAI.Application.Learning.Generation;

public sealed record AiTextResult(
    string Text,
    AiProvider Provider,
    AiTokenUsage? TokenUsage,
    int? TokensUsedThisMonth,
    int? MonthlyTokenLimit,
    string? MonthKey
);
