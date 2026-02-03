using VocabuAI.Application.Learning.Ai;
using VocabuAI.Application.Learning.Ai.PromptBuilders;
using VocabuAI.Application.Learning.Generation;
using VocabuAI.Application.Learning.Generation.Contracts;
using VocabuAI.Application.Learning.Generation.Validation;
using VocabuAI.Application.Learning.Selection;

namespace VocabuAI.Application.Learning;

/// <summary>
/// Backend-only AI helper service for learning sessions.
/// </summary>
public sealed class LearningSessionAiService
{
    private const int MaxVocabularyItems = 30;
    private readonly ILocalLlmClient _llmClient;
    private readonly IAiTextGenerationService _aiTextGenerationService;
    private readonly IFlashCardVocabularyRepository _vocabularyRepository;
    private readonly ILearningTextPromptBuilder _promptBuilder;
    private readonly TextGenerationValidator _validator = new();

    public LearningSessionAiService(
        ILocalLlmClient llmClient,
        IAiTextGenerationService aiTextGenerationService,
        IFlashCardVocabularyRepository vocabularyRepository,
        ILearningTextPromptBuilder promptBuilder)
    {
        _llmClient = llmClient;
        _aiTextGenerationService = aiTextGenerationService;
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
                errorMessage,
                request.Provider ?? AiProvider.Ollama,
                null,
                null);
        }

        var generatedText = await GenerateTextInternalAsync(
            generationRequest,
            vocabulary,
            request.Provider,
            cancellationToken);

        return new GenerateTextResponseDto(
            generatedText.Language,
            generatedText.Text,
            generatedText.ValidationResult.IsValid,
            generatedText.ValidationResult.ErrorMessage,
            generatedText.Provider,
            generatedText.TokenUsage,
            generatedText.UsagePercent);
    }

    public async Task<(string? ErrorMessage, IAsyncEnumerable<string>? Stream)> GenerateTextStreamAsync(
        int userId,
        GenerateTextRequestDto request,
        CancellationToken cancellationToken)
    {
        var resolvedProvider = request.Provider
            ?? await _aiTextGenerationService.ResolveProviderForUserAsync(
                userId,
                request.Provider,
                cancellationToken);

        if (resolvedProvider == AiProvider.OpenAi)
        {
            return ("OpenAI does not support streaming in this app yet.", null);
        }

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
        AiProvider? provider,
        CancellationToken cancellationToken)
    {
        var prompt = _promptBuilder.BuildPrompt(request, allowedVocabulary);
        var response = await _aiTextGenerationService.GenerateForUserAsync(
            request.UserId,
            provider,
            prompt,
            cancellationToken);

        var generatedText = new GeneratedText
        {
            Language = request.TargetLanguage,
            Text = response.Text,
            UsedVocabulary = new HashSet<string>(allowedVocabulary, StringComparer.OrdinalIgnoreCase),
            UsedGrammar = new HashSet<GrammarConceptId>(request.AllowedGrammar)
        };

        var validation = _validator.Validate(request, generatedText);
        var usagePercent = response.Provider == AiProvider.OpenAi
            ? OpenAiUsageCalculator.GetUsagePercent(
                response.TokensUsedThisMonth ?? 0,
                response.MonthlyTokenLimit ?? 0)
            : null;

        return generatedText with
        {
            ValidationResult = validation,
            Provider = response.Provider,
            TokenUsage = response.TokenUsage,
            UsagePercent = usagePercent
        };
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

        var learningCards = _vocabularyRepository
            .GetLearningFlashCardsByUserIdAndLanguageCode(userId, languageCode)
            .ToArray();

        var selectedCards = LearningFlashCardSelector.SelectFlashCardsForSession(
            MaxVocabularyItems,
            learningCards);

        vocabulary = selectedCards
            .Select(card => card.ForeignLanguage)
            .Where(term => !string.IsNullOrWhiteSpace(term))
            .Select(term => term.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        generationRequest = new TextGenerationRequest
        {
            UserId = userId,
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
