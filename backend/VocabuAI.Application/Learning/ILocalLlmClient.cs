namespace VocabuAI.Application.Learning;

/// <summary>
/// Backend-only abstraction over a local LLM client.
/// </summary>
public interface ILocalLlmClient
{
    /// <summary>
    /// Sends a prompt to the LLM and returns the raw response text.
    /// </summary>
    Task<string> GenerateAsync(string prompt, CancellationToken cancellationToken);

    /// <summary>
    /// Streams the response text from the LLM as it is generated.
    /// </summary>
    IAsyncEnumerable<string> GenerateStreamAsync(string prompt, CancellationToken cancellationToken);
}
