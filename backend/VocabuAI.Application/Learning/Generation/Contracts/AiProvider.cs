using System.Text.Json;
using System.Text.Json.Serialization;

namespace VocabuAI.Application.Learning.Generation.Contracts;

// Keep in sync with frontend/src/domain/AiProvider.ts

[JsonConverter(typeof(AiProviderJsonConverter))]
public enum AiProvider
{
    Ollama = 0,
    OpenAi = 1
}

public static class AiProviderExtensions
{
    public static string ToApiValue(this AiProvider provider)
        => provider switch
        {
            AiProvider.Ollama => "ollama",
            AiProvider.OpenAi => "openai",
            _ => "ollama"
        };

    public static bool TryParse(string? value, out AiProvider provider)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            provider = AiProvider.Ollama;
            return false;
        }

        var normalized = value.Trim().ToLowerInvariant();
        if (normalized == "ollama")
        {
            provider = AiProvider.Ollama;
            return true;
        }

        if (normalized == "openai")
        {
            provider = AiProvider.OpenAi;
            return true;
        }

        provider = AiProvider.Ollama;
        return false;
    }
}

internal sealed class AiProviderJsonConverter : JsonConverter<AiProvider>
{
    public override AiProvider Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.String)
        {
            var value = reader.GetString();
            if (AiProviderExtensions.TryParse(value, out var parsed))
            {
                return parsed;
            }
        }

        if (reader.TokenType == JsonTokenType.Number && reader.TryGetInt32(out var number))
        {
            return number switch
            {
                0 => AiProvider.Ollama,
                1 => AiProvider.OpenAi,
                _ => AiProvider.Ollama
            };
        }

        return AiProvider.Ollama;
    }

    public override void Write(Utf8JsonWriter writer, AiProvider value, JsonSerializerOptions options)
        => writer.WriteStringValue(value.ToApiValue());
}
