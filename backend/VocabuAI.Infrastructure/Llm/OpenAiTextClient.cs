using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using VocabuAI.Application.Learning.Generation;
using VocabuAI.Application.Learning.Generation.Contracts;
using VocabuAI.Application.Security;
using VocabuAI.Infrastructure.Repositories;

namespace VocabuAI.Infrastructure.Llm;

public sealed class OpenAiTextClient : IAiTextClient
{
    private const string ModelName = "gpt-4o-mini";
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly HttpClient _client;
    private readonly IUserRepository _users;
    private readonly ISecretProtector _protector;

    public OpenAiTextClient(HttpClient client, IUserRepository users, ISecretProtector protector)
    {
        _client = client;
        _users = users;
        _protector = protector;
    }

    public async Task<AiTextResult> GenerateAsync(AiTextRequest request, CancellationToken ct)
    {
        var user = _users.GetById(request.UserId);
        if (user is null)
        {
            throw new InvalidOperationException("User not found.");
        }

        if (string.IsNullOrWhiteSpace(user.OpenAiApiKeyEncrypted))
        {
            throw new InvalidOperationException("OpenAI API key is not configured.");
        }

        var apiKey = _protector.Decrypt(user.OpenAiApiKeyEncrypted);

        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, "v1/chat/completions");
        httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        httpRequest.Content = JsonContent.Create(new OpenAiChatCompletionRequest
        {
            Model = ModelName,
            Messages = new[]
            {
                new OpenAiChatMessage { Role = "user", Content = request.Prompt }
            }
        }, options: JsonOptions);

        using var response = await SendAsync(httpRequest, ct);
        if (!response.IsSuccessStatusCode)
        {
            var error = await TryReadErrorMessageAsync(response, ct);
            var message = string.IsNullOrWhiteSpace(error)
                ? $"OpenAI request failed with status {(int)response.StatusCode}."
                : $"OpenAI request failed: {error}";
            throw new InvalidOperationException(message);
        }

        var payload = await response.Content.ReadFromJsonAsync<OpenAiChatCompletionResponse>(JsonOptions, ct);
        var text = payload?.Choices?.FirstOrDefault()?.Message?.Content ?? "";
        var usage = payload?.Usage;
        var tokenUsage = usage is null
            ? null
            : new AiTokenUsage(usage.PromptTokens, usage.CompletionTokens, usage.TotalTokens);

        return new AiTextResult(text, AiProvider.OpenAi, tokenUsage, null, null, null);
    }

    private async Task<HttpResponseMessage> SendAsync(HttpRequestMessage httpRequest, CancellationToken ct)
    {
        try
        {
            return await _client.SendAsync(httpRequest, ct);
        }
        catch (TaskCanceledException) when (!ct.IsCancellationRequested)
        {
            throw new InvalidOperationException("OpenAI request timed out.");
        }
        catch (HttpRequestException ex)
        {
            throw new InvalidOperationException($"OpenAI request failed: {ex.Message}");
        }
    }

    private static async Task<string?> TryReadErrorMessageAsync(HttpResponseMessage response, CancellationToken ct)
    {
        try
        {
            var payload = await response.Content.ReadFromJsonAsync<OpenAiErrorResponse>(JsonOptions, ct);
            return payload?.Error?.Message;
        }
        catch
        {
            return null;
        }
    }

    private sealed class OpenAiChatCompletionRequest
    {
        public string Model { get; init; } = "";
        public IReadOnlyList<OpenAiChatMessage> Messages { get; init; } = Array.Empty<OpenAiChatMessage>();
    }

    private sealed class OpenAiChatMessage
    {
        public string Role { get; init; } = "";
        public string Content { get; init; } = "";
    }

    private sealed class OpenAiChatCompletionResponse
    {
        public IReadOnlyList<OpenAiChatChoice> Choices { get; init; } = Array.Empty<OpenAiChatChoice>();
        public OpenAiUsage? Usage { get; init; }
    }

    private sealed class OpenAiChatChoice
    {
        public OpenAiChatMessage Message { get; init; } = new();
    }

    private sealed class OpenAiUsage
    {
        [JsonPropertyName("prompt_tokens")]
        public int PromptTokens { get; init; }

        [JsonPropertyName("completion_tokens")]
        public int CompletionTokens { get; init; }

        [JsonPropertyName("total_tokens")]
        public int TotalTokens { get; init; }
    }

    private sealed class OpenAiErrorResponse
    {
        public OpenAiError? Error { get; init; }
    }

    private sealed class OpenAiError
    {
        public string? Message { get; init; }
    }
}
