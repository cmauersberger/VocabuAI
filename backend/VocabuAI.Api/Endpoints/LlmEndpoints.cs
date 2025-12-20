using Microsoft.AspNetCore.Authorization;
using VocabuAI.Api.Infrastructure;

namespace VocabuAI.Api.Endpoints;

public static class LlmEndpoints
{
    public static void MapLlmEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/llm/generate", async (GenerateRequest request, OllamaClient ollama, CancellationToken ct) =>
            {
                if (string.IsNullOrWhiteSpace(request.Prompt))
                    return Results.BadRequest(new { message = "Prompt is required." });

                var result = await ollama.GenerateAsync(request.Prompt, ct);
                return Results.Ok(new { text = result.response });
            })
            .RequireAuthorization()
            .WithTags("LLM")
            .WithName("GenerateText");
    }
}

public sealed record GenerateRequest(string Prompt);
