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
    private readonly IFlashCardVocabularyRepository _vocabularyRepository;
    private readonly TextGenerationValidator _validator = new();

    public LearningSessionAiService(
        ILocalLlmClient llmClient,
        IFlashCardVocabularyRepository vocabularyRepository)
    {
        _llmClient = llmClient;
        _vocabularyRepository = vocabularyRepository;
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
    public async Task<GenerateTextResponseDto> GenerateTextAsync(
        int userId,
        GenerateTextRequestDto request,
        CancellationToken cancellationToken)
    {
        if (!TryBuildGenerationContext(
                userId,
                request,
                out var generationRequest,
                out var vocabulary,
                out var errorMessage))
        {
            return new GenerateTextResponseDto(
                request.TargetLanguage,
                "",
                false,
                errorMessage);
        }

        var generatedText = await GenerateTextInternalAsync(
            generationRequest,
            vocabulary,
            cancellationToken);

        return new GenerateTextResponseDto(
            generatedText.Language,
            generatedText.Text,
            generatedText.ValidationResult.IsValid,
            generatedText.ValidationResult.ErrorMessage);
    }

    public (string? ErrorMessage, IAsyncEnumerable<string>? Stream) GenerateTextStream(
        int userId,
        GenerateTextRequestDto request,
        CancellationToken cancellationToken)
    {
        if (!TryBuildGenerationContext(
                userId,
                request,
                out var generationRequest,
                out var vocabulary,
                out var errorMessage))
        {
            return (errorMessage, null);
        }

        return (null, GenerateTextStreamInternal(generationRequest, vocabulary, cancellationToken));
    }

    private async Task<GeneratedText> GenerateTextInternalAsync(
        TextGenerationRequest request,
        IReadOnlyCollection<string> allowedVocabulary,
        CancellationToken cancellationToken)
    {
        var prompt = BuildPrompt(request, allowedVocabulary);
        var response = await _llmClient.GenerateAsync(prompt, cancellationToken);

        var generatedText = new GeneratedText
        {
            Language = request.TargetLanguage,
            Text = response,
            UsedVocabulary = new HashSet<string>(allowedVocabulary, StringComparer.OrdinalIgnoreCase),
            UsedGrammar = new HashSet<GrammarConceptId>(request.AllowedGrammar)
        };

        var validation = _validator.Validate(request, generatedText);
        return generatedText with { ValidationResult = validation };
    }

    private static string BuildPrompt(
        TextGenerationRequest request,
        IReadOnlyCollection<string> allowedVocabulary)
    {
        var vocabulary = allowedVocabulary.Count == 0
            ? "none"
            : string.Join(", ", allowedVocabulary);

        var grammar = request.AllowedGrammar.Count == 0
            ? "none"
            : string.Join(", ", request.AllowedGrammar);

        var builder = new StringBuilder();
        if (request.TargetLanguage == Language.Arabic)
        {
            builder.AppendLine("You are an expert Arabic linguist.");
            builder.AppendLine("Always respond in Modern Standard Arabic (الفصحى).");
            builder.AppendLine("Use correct grammar, proper agreement, and natural phrasing.");
            builder.AppendLine("Avoid dialect unless explicitly requested.");
        }
        builder.AppendLine("Generate a text with the following constraints:");
        builder.AppendLine($"Target language: {request.TargetLanguage}.");
        builder.AppendLine($"Word count: {request.MinWordCount}-{request.MaxWordCount}.");
        builder.AppendLine($"Allowed vocabulary lemmas: {vocabulary}.");
        builder.AppendLine("You must prioritize using the allowed vocabulary lemmas, but you may use additional simple words as needed.");
        builder.AppendLine("Adapt the prioritized words to fit correct grammar and meaning (e.g., conjugate verbs and keep a single tense).");
        builder.AppendLine("Most important: the text must be grammatically correct and make sense.");
        builder.AppendLine($"Allowed grammar concepts: {grammar}.");
        if (request.AllowedGrammar.Contains(GrammarConceptId.ArabicFullyVocalized))
        {
            builder.AppendLine("Requirement: The Arabic text must be fully vocalized (include diacritics).");
        }
        builder.AppendLine($"Style: {request.Style}.");
        builder.AppendLine($"Difficulty: {request.Difficulty}.");

        return builder.ToString();
    }

    private bool TryBuildGenerationContext(
        int userId,
        GenerateTextRequestDto request,
        out TextGenerationRequest generationRequest,
        out IReadOnlyCollection<string> vocabulary,
        out string errorMessage)
    {
        if (!TryGetLanguageCode(request.TargetLanguage, out var languageCode, out errorMessage))
        {
            generationRequest = new TextGenerationRequest();
            vocabulary = Array.Empty<string>();
            return false;
        }

        vocabulary = _vocabularyRepository
            .GetForeignLanguageTermsByUserIdAndLanguageCode(userId, languageCode)
            .Where(term => !string.IsNullOrWhiteSpace(term))
            .Select(term => term.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        generationRequest = new TextGenerationRequest
        {
            TargetLanguage = request.TargetLanguage,
            AllowedGrammar = request.AllowedGrammar?.ToHashSet() ?? new HashSet<GrammarConceptId>(),
            MinWordCount = request.MinWordCount,
            MaxWordCount = request.MaxWordCount,
            Style = request.Style,
            Difficulty = request.Difficulty
        };

        errorMessage = "";
        return true;
    }

    private async IAsyncEnumerable<string> GenerateTextStreamInternal(
        TextGenerationRequest request,
        IReadOnlyCollection<string> allowedVocabulary,
        [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken)
    {
        var prompt = BuildPrompt(request, allowedVocabulary);
        await foreach (var chunk in _llmClient.GenerateStreamAsync(prompt, cancellationToken))
        {
            yield return chunk;
        }
    }

    private static bool TryGetLanguageCode(
        Language language,
        out string languageCode,
        out string errorMessage)
    {
        if (!Enum.IsDefined(typeof(Language), language) || language == Language.Unknown)
        {
            languageCode = "";
            errorMessage = "Target language is not supported.";
            return false;
        }

        switch (language)
        {
            case Language.Arabic:
                languageCode = "ar";
                errorMessage = "";
                return true;
            case Language.English:
                languageCode = "en";
                errorMessage = "";
                return true;
            default:
                languageCode = "";
                errorMessage = "Target language is not supported.";
                return false;
        }
    }
}
