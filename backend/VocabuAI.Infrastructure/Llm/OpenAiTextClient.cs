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

        using var response = await _client.SendAsync(httpRequest, ct);
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"OpenAI request failed with status {(int)response.StatusCode}.");
        }

        var payload = await response.Content.ReadFromJsonAsync<OpenAiChatCompletionResponse>(JsonOptions, ct);
        var text = payload?.Choices?.FirstOrDefault()?.Message?.Content ?? "";
        var usage = payload?.Usage;
        var tokenUsage = usage is null
            ? null
            : new AiTokenUsage(usage.PromptTokens, usage.CompletionTokens, usage.TotalTokens);

        return new AiTextResult(text, AiProvider.OpenAi, tokenUsage, null, null, null);
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
}
