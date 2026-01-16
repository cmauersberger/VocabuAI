namespace VocabuAI.Application.Learning.Generation.Contracts;

/// <summary>
/// Backend-only contract describing a constrained AI text generation request.
/// </summary>
public sealed record TextGenerationRequest
{
    /// <summary>
    /// Target language for the generated text.
    /// </summary>
    public Language TargetLanguage { get; init; } = Language.Unknown;

    /// <summary>
    /// Allowed grammar concepts for generation.
    /// </summary>
    public IReadOnlySet<GrammarConceptId> AllowedGrammar { get; init; } = new HashSet<GrammarConceptId>();

    /// <summary>
    /// Minimum word count requirement.
    /// </summary>
    public int MinWordCount { get; init; }

    /// <summary>
    /// Maximum word count requirement.
    /// </summary>
    public int MaxWordCount { get; init; }

    /// <summary>
    /// Desired text style.
    /// </summary>
    public TextStyle Style { get; init; } = TextStyle.Unspecified;

    /// <summary>
    /// Desired difficulty level.
    /// </summary>
    public DifficultyLevel Difficulty { get; init; } = DifficultyLevel.Unspecified;
}
