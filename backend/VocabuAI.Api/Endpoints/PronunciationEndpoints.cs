using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using VocabuAI.Application.Pronunciation;
using VocabuAI.Api.Dtos;

namespace VocabuAI.Api.Endpoints;

public static class PronunciationEndpoints
{
    public static void MapPronunciationEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/pronunciation");
        group.RequireAuthorization();

        group.MapGet("/lookup", async (
                string term,
                string languageCode,
                ClaimsPrincipal user,
                IPronunciationLookupService pronunciationLookupService,
                CancellationToken cancellationToken) =>
            {
                if (!TryGetUserId(user, out _))
                {
                    return Results.Unauthorized();
                }

                if (string.IsNullOrWhiteSpace(term))
                {
                    return Results.BadRequest(new { message = "Term is required." });
                }

                if (string.IsNullOrWhiteSpace(languageCode))
                {
                    return Results.BadRequest(new { message = "LanguageCode is required." });
                }

                var result = await pronunciationLookupService.LookupAsync(
                    term,
                    languageCode,
                    cancellationToken);

                return Results.Ok(ToDto(result));
            })
            .WithTags("Pronunciation")
            .WithName("LookupPronunciation");
    }

    private static bool TryGetUserId(ClaimsPrincipal user, out int userId)
    {
        var idValue = user.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? user.FindFirstValue(JwtRegisteredClaimNames.Sub);

        return int.TryParse(idValue, out userId);
    }

    private static PronunciationLookupResponseDto ToDto(PronunciationLookupResult result)
        => new(
            result.Term,
            result.LanguageCode,
            result.IsAvailable,
            result.AudioUrl,
            result.AttributionUrl,
            result.LicenseShortName,
            result.Creator,
            result.Credit,
            result.Source,
            result.Message);
}
