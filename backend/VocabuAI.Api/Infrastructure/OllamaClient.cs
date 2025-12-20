using System.Net.Http.Json;
using Microsoft.Extensions.Options;

namespace VocabuAI.Api.Infrastructure;

public sealed class OllamaClient
{
    private readonly HttpClient _httpClient;
    private readonly OllamaOptions _options;

    public OllamaClient(HttpClient httpClient, IOptions<OllamaOptions> options)
    {
        _httpClient = httpClient;
        _options = options.Value;
    }

    public async Task<OllamaGenerateResponse> GenerateAsync(string prompt, CancellationToken cancellationToken)
    {
        var request = new OllamaGenerateRequest(
            model: _options.Model,
            prompt: prompt,
            stream: false
        );

        using var response = await _httpClient.PostAsJsonAsync("/api/generate", request, cancellationToken);
        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadFromJsonAsync<OllamaGenerateResponse>(cancellationToken: cancellationToken);
        return body ?? new OllamaGenerateResponse(response: "", done: true);
    }
}

public sealed record OllamaGenerateRequest(
    string model,
    string prompt,
    bool stream
);

public sealed record OllamaGenerateResponse(
    string response,
    bool done
);

