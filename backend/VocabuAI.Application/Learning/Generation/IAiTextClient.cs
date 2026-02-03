namespace VocabuAI.Application.Learning.Generation;

public interface IAiTextClient
{
    Task<AiTextResult> GenerateAsync(AiTextRequest request, CancellationToken ct);
}
