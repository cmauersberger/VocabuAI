namespace VocabuAI.Api.Dtos;

// Keep in sync with frontend/src/domain/dtos/GeneratedLearningTextDto.ts
public sealed record GeneratedLearningTextDto(
    int Id,
    string Prompt,
    string Text,
    string Provider,
    DateTimeOffset DateTimeCreated
);
