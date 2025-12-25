namespace VocabuAI.Infrastructure;

public sealed class OllamaOptions
{
    public const string SectionName = "Ollama";

    public string BaseUrl { get; init; } = "";
    public string Model { get; init; } = "llama3";
}
