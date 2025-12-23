namespace VocabuAI.Api.Endpoints;

public static class HealthEndpoints
{
    public static void MapHealthEndpoints(this IEndpointRouteBuilder app, string version)
    {
        app.MapGet("/health", () => Results.Ok($"backend running on version {version}"))
            .AllowAnonymous()
            .WithName("Health");
    }
}
