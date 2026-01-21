using VocabuAI.Application.Learning.Generation.Contracts;

namespace VocabuAI.Application.Learning.Ai.PromptBuilders.LanguageRules;

public sealed class GenericLanguageRules : ILanguageRules
{
    public int Priority => 0;

    public bool AppliesTo(Language language) => language != Language.Unknown;

    public IEnumerable<string> GetRules(TextGenerationRequest request)
    {
        yield return "Produce grammatically correct and coherent text.";
        yield return "Keep the text natural and readable.";
        yield return "Output only the generated text; omit explanations or meta-comments.";
    }
}
