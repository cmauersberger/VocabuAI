using VocabuAI.Application.Learning;

namespace VocabuAI.Api.Endpoints;

public static class HealthEndpoints
{
    public static void MapHealthEndpoints(this IEndpointRouteBuilder app, string version)
    {
        app.MapGet("/health", () => Results.Ok($"backend running on version {version}"))
            .AllowAnonymous()
            .WithName("Health");

        app.MapGet("/healthllm", async (
                ILocalLlmClient llmClient,
                CancellationToken cancellationToken) =>
            {
                try
                {
                    using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
                    timeoutCts.CancelAfter(TimeSpan.FromSeconds(15));

                    var response = await llmClient.GenerateAsync("Reply with OK only.", timeoutCts.Token);
                    if (response.Contains("OK", StringComparison.OrdinalIgnoreCase))
                    {
                        Console.WriteLine("LLM health check OK.");
                        return Results.Ok("llm: ok");
                    }

                    Console.WriteLine($"LLM health check returned unexpected response: {response}");
                }
                catch (TaskCanceledException)
                {
                    Console.WriteLine("LLM health check timed out.");
                }
                catch (OperationCanceledException)
                {
                    Console.WriteLine("LLM health check canceled.");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"LLM health check failed: {ex.Message}");
                }

                return Results.StatusCode(StatusCodes.Status503ServiceUnavailable);
            })
            .RequireAuthorization()
            .WithName("HealthLlm");
    }
}
