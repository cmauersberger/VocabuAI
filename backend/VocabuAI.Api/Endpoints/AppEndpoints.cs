using VocabuAI.Api.Dtos;
using VocabuAI.Api.Infrastructure;

namespace VocabuAI.Api.Endpoints;

public static class AppEndpoints
{
    public static void MapAppEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/app");

        group.MapGet("/version", (AppBuildInfo buildInfo) =>
            Results.Ok(new AppVersionDto(
                buildInfo.ApplicationName,
                buildInfo.Version,
                buildInfo.CommitSha,
                buildInfo.Branch,
                buildInfo.BuildTimeUtc)))
            .AllowAnonymous()
            .WithTags("App")
            .WithName("GetAppVersion");
    }
}
