namespace VocabuAI.Infrastructure.Llm;

public sealed class LlmOptions
{
    public const string SectionName = "Llm";

    public string BaseUrl { get; init; } = "http://localhost:11434";
    public string Model { get; init; } = "qwen2.5:7b";
    public int TimeoutSeconds { get; init; } = 20;
}
