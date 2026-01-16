using System.Text;
using VocabuAI.Application.Learning.Generation;
using VocabuAI.Application.Learning.Generation.Contracts;
using VocabuAI.Application.Learning.Generation.Validation;

namespace VocabuAI.Application.Learning;

/// <summary>
/// Backend-only AI helper service for learning sessions.
/// </summary>
public sealed class LearningSessionAiService
{
    private readonly ILocalLlmClient _llmClient;
    private readonly TextGenerationValidator _validator = new();

    public LearningSessionAiService(ILocalLlmClient llmClient)
    {
        _llmClient = llmClient;
    }

    /// <summary>
    /// Generates an example Arabic word via the LLM for internal testing.
    /// </summary>
    public async Task GenerateInterestingArabicWordAsync(CancellationToken cancellationToken)
    {
        const string prompt = "Show me an interesting word in arab, fully vocalized, and its translation and explanation in english.";
        await _llmClient.GenerateAsync(prompt, cancellationToken);
    }

    /// <summary>
    /// Generates AI text based on the provided generation request contract.
    /// </summary>
    public async Task<GeneratedText> GenerateText(TextGenerationRequest request, CancellationToken cancellationToken)
    {
        var prompt = BuildPrompt(request);
        var response = await _llmClient.GenerateAsync(prompt, cancellationToken);

        var generatedText = new GeneratedText
        {
            Language = request.TargetLanguage,
            Text = response,
            UsedVocabulary = new HashSet<string>(),
            UsedGrammar = new HashSet<GrammarConceptId>()
        };

        var validation = _validator.Validate(request, generatedText);
        if (!validation.IsValid)
        {
            return generatedText with { ValidationResult = validation };
        }

        return generatedText with { ValidationResult = validation };
    }

    private static string BuildPrompt(TextGenerationRequest request)
    {
        var vocabulary = request.AllowedVocabularyLemmas.Count == 0
            ? "none"
            : string.Join(", ", request.AllowedVocabularyLemmas);

        var grammar = request.AllowedGrammar.Count == 0
            ? "none"
            : string.Join(", ", request.AllowedGrammar);

        var builder = new StringBuilder();
        builder.AppendLine("Generate a text with the following constraints:");
        builder.AppendLine($"Target language: {request.TargetLanguage}.");
        builder.AppendLine($"Word count: {request.MinWordCount}-{request.MaxWordCount}.");
        builder.AppendLine($"Allowed vocabulary lemmas: {vocabulary}.");
        builder.AppendLine($"Allowed grammar concepts: {grammar}.");
        builder.AppendLine($"Style: {request.Style}.");
        builder.AppendLine($"Difficulty: {request.Difficulty}.");

        return builder.ToString();
    }
}
