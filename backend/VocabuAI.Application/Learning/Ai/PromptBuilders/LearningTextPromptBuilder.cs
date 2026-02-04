using System.Text;
using VocabuAI.Application.Learning.Ai.PromptBuilders.LanguageRules;
using VocabuAI.Application.Learning.Generation.Contracts;

namespace VocabuAI.Application.Learning.Ai.PromptBuilders;

public sealed class LearningTextPromptBuilder : ILearningTextPromptBuilder
{
    private readonly IReadOnlyCollection<ILanguageRules> _languageRules;

    public LearningTextPromptBuilder(IEnumerable<ILanguageRules> languageRules)
    {
        _languageRules = languageRules.ToArray();
    }

    public string BuildPrompt(TextGenerationRequest request, IReadOnlyCollection<string> vocabularyLemmas)
    {
        var builder = new StringBuilder();
        var languageName = GetLanguageDisplayName(request.TargetLanguage);
        var vocabularyList = FormatVocabulary(vocabularyLemmas);
        var dominantGrammar = FormatGrammarConcepts(request.AllowedGrammar);
        var forbiddenGrammar = FormatGrammarConcepts(request.ForbiddenGrammar);

        builder.AppendLine("Language requirements:");
        builder.AppendLine($"- Write as an expert writer in {languageName}.");

        foreach (var rule in GetLanguageRules(request))
        {
            builder.AppendLine($"- {rule}");
        }

        builder.AppendLine();
        builder.AppendLine("Task constraints:");
        builder.AppendLine($"- Target language: {languageName}.");
        builder.AppendLine($"- Word count range: {request.MinWordCount}-{request.MaxWordCount}.");
        builder.AppendLine($"- Style: {GetStyleDescription(request.Style)}");
        builder.AppendLine($"- Difficulty: {request.LanguageLevel.GetDescription()}");

        builder.AppendLine();
        builder.AppendLine("Vocabulary guidance:");
        builder.AppendLine($"- Vocabulary lemma pool (soft inspiration): {vocabularyList}.");
        builder.AppendLine("- Inflected, conjugated, and declined forms are acceptable.");
        builder.AppendLine("- Additional words may be used to ensure coherence and meaning.");
        builder.AppendLine("- Not all lemmas must be used; repetition is acceptable.");

        builder.AppendLine();
        builder.AppendLine("Grammar constraints:");
        builder.AppendLine($"- Dominant grammar concepts (strong guidance): {dominantGrammar}.");
        builder.AppendLine($"- Forbidden grammar concepts: {forbiddenGrammar}.");
        builder.AppendLine("- If any constraint is violated, revise internally before producing output.");

        builder.AppendLine();
        builder.AppendLine("Priority order:");
        builder.AppendLine("1) grammatical correctness and overall coherence.");
        builder.AppendLine("2) prefer using the vocabulary lemma pool.");
        builder.AppendLine("3) respect the difficulty level.");
        builder.AppendLine("4) avoid forbidden grammar concepts.");
        builder.AppendLine("5) respect the requested style.");
        builder.AppendLine("6) keep within the word count range (soft constraint).");

        return builder.ToString();
    }

    private IEnumerable<string> GetLanguageRules(TextGenerationRequest request) =>
        _languageRules
            .Where(rule => rule.AppliesTo(request.TargetLanguage))
            .OrderBy(rule => rule.Priority)
            .SelectMany(rule => rule.GetRules(request));

    private static string FormatVocabulary(IReadOnlyCollection<string> vocabularyLemmas) =>
        vocabularyLemmas.Count == 0
            ? "none provided"
            : string.Join(", ", vocabularyLemmas);

    private static string FormatGrammarConcepts(IReadOnlySet<GrammarConceptId> grammarConcepts)
    {
        var descriptions = grammarConcepts
            .Where(concept => concept != GrammarConceptId.Unspecified)
            .Select(concept => concept.GetDescription())
            .ToArray();

        return descriptions.Length == 0
            ? "none specified"
            : string.Join(", ", descriptions);
    }

    private static string GetStyleDescription(TextStyle style) =>
        style switch
        {
            TextStyle.Neutral => "Neutral, informational tone.",
            TextStyle.Narrative => "Narrative, story-like tone.",
            TextStyle.Conversational => "Conversational tone.",
            TextStyle.Unspecified => "Default neutral tone (no specific style provided).",
            _ => "Neutral tone."
        };

    private static string GetLanguageDisplayName(Language language) =>
        language switch
        {
            Language.Arabic => "Arabic",
            Language.English => "English",
            _ => "Unspecified language"
        };
}
