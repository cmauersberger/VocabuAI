namespace VocabuAI.Application.Learning.Generation;

public sealed record AiTokenUsage(
    int PromptTokens,
    int CompletionTokens,
    int TotalTokens
);
