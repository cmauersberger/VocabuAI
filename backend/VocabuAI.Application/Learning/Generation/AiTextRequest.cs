using VocabuAI.Application.Learning.Generation.Contracts;

namespace VocabuAI.Application.Learning.Generation;

public sealed record AiTextRequest(
    int UserId,
    AiProvider Provider,
    string Prompt
);
