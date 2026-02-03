using VocabuAI.Application.Learning;
using VocabuAI.Application.Learning.Generation;
using VocabuAI.Application.Learning.Generation.Contracts;

namespace VocabuAI.Infrastructure.Llm;

public sealed class OllamaAiTextClient : IAiTextClient
{
    private readonly ILocalLlmClient _localClient;

    public OllamaAiTextClient(ILocalLlmClient localClient)
    {
        _localClient = localClient;
    }

    public async Task<AiTextResult> GenerateAsync(AiTextRequest request, CancellationToken ct)
    {
        var text = await _localClient.GenerateAsync(request.Prompt, ct);
        return new AiTextResult(text, AiProvider.Ollama, null, null, null, null);
    }
}
