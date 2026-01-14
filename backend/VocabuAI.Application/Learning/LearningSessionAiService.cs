namespace VocabuAI.Application.Learning;

public sealed class LearningSessionAiService
{
    private readonly ILocalLlmClient _llmClient;

    public LearningSessionAiService(ILocalLlmClient llmClient)
    {
        _llmClient = llmClient;
    }

    public async Task GenerateInterestingArabicWordAsync(CancellationToken cancellationToken)
    {
        const string prompt = "Show me an interesting word in arab, fully vocalized, and its translation and explanation in english.";

        try
        {
            var response = await _llmClient.GenerateAsync(prompt, cancellationToken);
            Console.WriteLine($"LLM response: {response}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to generate an interesting Arabic word: {ex}");
            throw;
        }
    }
}
