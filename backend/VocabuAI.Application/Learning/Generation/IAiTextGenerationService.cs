using VocabuAI.Application.Learning.Generation.Contracts;

namespace VocabuAI.Application.Learning.Generation;

public interface IAiTextGenerationService
{
    Task<AiTextResult> GenerateForUserAsync(
        int userId,
        AiProvider? provider,
        string prompt,
        CancellationToken ct);

    Task<AiProvider> ResolveProviderForUserAsync(
        int userId,
        AiProvider? provider,
        CancellationToken ct);
}
