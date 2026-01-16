using VocabuAI.Application.Learning.Generation.Contracts;
using VocabuAI.Application.Learning.Generation.Validation;

namespace VocabuAI.Application.Learning.Generation;

/// <summary>
/// Backend-only result of AI text generation.
/// </summary>
public sealed record GeneratedText
{
    /// <summary>
    /// Language of the generated text.
    /// </summary>
    public Language Language { get; init; } = Language.Unknown;

    /// <summary>
    /// Generated text content.
    /// </summary>
    public string Text { get; init; } = "";

    /// <summary>
    /// Vocabulary lemmas used in the generated text.
    /// </summary>
    public IReadOnlySet<string> UsedVocabulary { get; init; } = new HashSet<string>();

    /// <summary>
    /// Grammar concepts used in the generated text.
    /// </summary>
    public IReadOnlySet<GrammarConceptId> UsedGrammar { get; init; } = new HashSet<GrammarConceptId>();

    /// <summary>
    /// Validation result for the generated text.
    /// </summary>
    public TextGenerationValidationResult ValidationResult { get; init; } = TextGenerationValidationResult.Success();
}
