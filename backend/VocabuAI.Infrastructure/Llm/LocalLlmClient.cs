using System.Net.Http.Json;
using System.Runtime.CompilerServices;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;
using VocabuAI.Application.Learning;

namespace VocabuAI.Infrastructure.Llm;

public sealed class LocalLlmClient : ILocalLlmClient
{
    private readonly HttpClient _httpClient;
    private readonly IOptions<LlmOptions> _options;

    public LocalLlmClient(HttpClient httpClient, IOptions<LlmOptions> options)
    {
        _httpClient = httpClient;
        _options = options;
    }

    public async Task<string> GenerateAsync(string prompt, CancellationToken cancellationToken)
    {
        var startedAt = DateTimeOffset.UtcNow;
        var request = new GenerateRequest(_options.Value.Model, prompt, false);
        using var response = await _httpClient.PostAsJsonAsync("api/generate", request, cancellationToken);
        response.EnsureSuccessStatusCode();

        var payload = await response.Content.ReadFromJsonAsync<GenerateResponse>(cancellationToken: cancellationToken);
        if (string.IsNullOrWhiteSpace(payload?.Response))
        {
            throw new InvalidOperationException("LLM response payload is missing the response field.");
        }

        var elapsed = DateTimeOffset.UtcNow - startedAt;
        Console.WriteLine(
            $"LLM GenerateAsync completed in {elapsed.TotalMilliseconds:0} ms. Response length: {payload.Response.Length}. Prompt: {prompt}.");

        return payload.Response;
    }

    public async IAsyncEnumerable<string> GenerateStreamAsync(
        string prompt,
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        var request = new GenerateRequest(_options.Value.Model, prompt, true);
        using var message = new HttpRequestMessage(HttpMethod.Post, "api/generate")
        {
            Content = JsonContent.Create(request)
        };

        using var response = await _httpClient.SendAsync(
            message,
            HttpCompletionOption.ResponseHeadersRead,
            cancellationToken);
        response.EnsureSuccessStatusCode();

        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var reader = new StreamReader(stream);

        while (!reader.EndOfStream)
        {
            var line = await reader.ReadLineAsync(cancellationToken);
            if (string.IsNullOrWhiteSpace(line))
            {
                continue;
            }

            using var json = JsonDocument.Parse(line);
            var root = json.RootElement;
            if (root.TryGetProperty("response", out var responseValue))
            {
                var chunk = responseValue.GetString();
                if (!string.IsNullOrEmpty(chunk))
                {
                    yield return chunk;
                }
            }

            if (root.TryGetProperty("done", out var doneValue) && doneValue.GetBoolean())
            {
                yield break;
            }
        }
    }

    private sealed record GenerateRequest(
        [property: JsonPropertyName("model")] string Model,
        [property: JsonPropertyName("prompt")] string Prompt,
        [property: JsonPropertyName("stream")] bool Stream);

    private sealed record GenerateResponse(
        [property: JsonPropertyName("response")] string? Response);
}
