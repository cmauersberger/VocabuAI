namespace VocabuAI.Application.Learning;

public interface ILocalLlmClient
{
    Task<string> GenerateAsync(string prompt, CancellationToken cancellationToken);
}
