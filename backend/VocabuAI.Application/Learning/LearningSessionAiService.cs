using VocabuAI.Application.Learning.Ai;
using VocabuAI.Application.Learning.Ai.PromptBuilders;
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
    private readonly ILearningTextPromptBuilder _promptBuilder;
    private readonly TextGenerationValidator _validator = new();

    public LearningSessionAiService(
        ILocalLlmClient llmClient,
        IFlashCardVocabularyRepository vocabularyRepository,
        ILearningTextPromptBuilder promptBuilder)
    {
        _llmClient = llmClient;
        _vocabularyRepository = vocabularyRepository;
        _promptBuilder = promptBuilder;
    }

    /// <summary>
    /// Generates an example Arabic word via the LLM for internal testing.
    /// </summary>
    public async Task GenerateInterestingArabicWordAsync(CancellationToken cancellationToken)
    {
        var prompt = LearningSessionAiPrompts.GetInterestingArabicWordPrompt();
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
        var prompt = _promptBuilder.BuildPrompt(request, allowedVocabulary);
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
            ForbiddenGrammar = request.ForbiddenGrammar?.ToHashSet() ?? new HashSet<GrammarConceptId>(),
            MinWordCount = request.MinWordCount,
            MaxWordCount = request.MaxWordCount,
            Style = request.Style,
            LanguageLevel = request.LanguageLevel
        };

        errorMessage = "";
        return true;
    }

    private async IAsyncEnumerable<string> GenerateTextStreamInternal(
        TextGenerationRequest request,
        IReadOnlyCollection<string> allowedVocabulary,
        [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken)
    {
        var prompt = _promptBuilder.BuildPrompt(request, allowedVocabulary);
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
