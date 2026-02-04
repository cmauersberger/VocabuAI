using VocabuAI.Application.Learning.Generation.Contracts;

namespace VocabuAI.Application.Learning.Ai.PromptBuilders.LanguageRules;

public sealed class ArabicLanguageRules : ILanguageRules
{
    public int Priority => 10;

    public bool AppliesTo(Language language) => language == Language.Arabic;

    public IEnumerable<string> GetRules(TextGenerationRequest request)
    {
        yield return "Use Modern Standard Arabic (al-fusha) only; avoid dialect.";
        yield return "Maintain a consistent register across the entire text.";
        yield return "Do not mix languages or insert foreign words.";
        yield return "Prioritize readability over theoretical perfection; simplified case endings are acceptable for simple texts.";

        if (request.AllowedGrammar.Contains(GrammarConceptId.ArabicFullyVocalized))
        {
            yield return "Full vocalization is required, so include diacritics on all or nearly all words.";
        }
    }
}
