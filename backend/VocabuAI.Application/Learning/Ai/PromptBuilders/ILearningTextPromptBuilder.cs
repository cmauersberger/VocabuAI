using VocabuAI.Application.Learning.Generation.Contracts;

namespace VocabuAI.Application.Learning.Ai.PromptBuilders;

public interface ILearningTextPromptBuilder
{
    string BuildPrompt(TextGenerationRequest request, IReadOnlyCollection<string> vocabularyLemmas);
}
