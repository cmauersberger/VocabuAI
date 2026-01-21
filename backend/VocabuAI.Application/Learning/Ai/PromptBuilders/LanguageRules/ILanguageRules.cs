using VocabuAI.Application.Learning.Generation.Contracts;

namespace VocabuAI.Application.Learning.Ai.PromptBuilders.LanguageRules;

public interface ILanguageRules
{
    int Priority { get; }

    bool AppliesTo(Language language);

    IEnumerable<string> GetRules(TextGenerationRequest request);
}
