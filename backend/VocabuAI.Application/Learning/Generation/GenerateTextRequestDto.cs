using VocabuAI.Application.Learning.Generation.Contracts;

namespace VocabuAI.Application.Learning.Generation;

// Keep in sync with frontend/src/domain/dtos/GenerateTextRequestDto.ts

public sealed record GenerateTextRequestDto(
    Language TargetLanguage,
    int MinWordCount,
    int MaxWordCount,
    IReadOnlyCollection<GrammarConceptId> AllowedGrammar,
    TextStyle Style,
    DifficultyLevel Difficulty
);
