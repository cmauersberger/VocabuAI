using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using VocabuAI.Api.Infrastructure;

namespace VocabuAI.Api.Endpoints;

public static class FlashCardBackupEndpoints
{
    private const long MaxBackupFileSizeBytes = 2 * 1024 * 1024;

    public static void MapFlashCardBackupEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/flashcards/backup");
        group.RequireAuthorization();

        group.MapGet("/export", (ClaimsPrincipal user, FlashCardImportExportService service) =>
            {
                if (!TryGetUserId(user, out var userId))
                    return Results.Unauthorized();

                var json = service.ExportAsJson(userId);
                var fileName = $"vocabuai-backup-{DateTimeOffset.UtcNow:yyyy-MM-dd_HH_mm}.vocabuai";
                return Results.File(Encoding.UTF8.GetBytes(json), "application/json", fileName);
            })
            .WithTags("FlashCards")
            .WithName("ExportFlashCardsBackup");

        group.MapPost("/import", async (
                IFormFile file,
                ClaimsPrincipal user,
                FlashCardImportExportService service,
                CancellationToken cancellationToken) =>
            {
                if (!TryGetUserId(user, out var userId))
                    return Results.Unauthorized();

                if (file.Length == 0)
                    return Results.BadRequest(new { message = "File is required." });

                if (!string.Equals(Path.GetExtension(file.FileName), ".vocabuai", StringComparison.OrdinalIgnoreCase))
                    return Results.BadRequest(new { message = "File must have a .vocabuai extension." });

                if (file.Length > MaxBackupFileSizeBytes)
                    return Results.BadRequest(new { message = "File is too large." });

                await using var stream = file.OpenReadStream();
                var result = await service.ImportAsync(stream, userId, cancellationToken);
                return Results.Ok(result);
            })
            .Accepts<IFormFile>("multipart/form-data")
            .DisableAntiforgery()
            .WithTags("FlashCards")
            .WithName("ImportFlashCardsBackup");
    }

    private static bool TryGetUserId(ClaimsPrincipal user, out int userId)
    {
        var idValue = user.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? user.FindFirstValue(JwtRegisteredClaimNames.Sub);

        return int.TryParse(idValue, out userId);
    }
}
