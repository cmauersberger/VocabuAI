using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using VocabuAI.Application.Learning;
using VocabuAI.Infrastructure.Repositories;

namespace VocabuAI.Api.Endpoints;

public static class LearningSessionEndpoints
{
    public static void MapLearningSessionEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/learningSession");
        group.RequireAuthorization();

        group.MapPost("/create", (
                LearningSessionCreateRequest request,
                ClaimsPrincipal user,
                IFlashCardRepository repository,
                ILearningSessionService learningSessionService) =>
            {
                if (!TryGetUserId(user, out var userId))
                    return Results.Unauthorized();

                if (request.TaskCount <= 0)
                    return Results.BadRequest(new { message = "TaskCount must be greater than 0." });

                var flashCards = repository.GetAllByUserId(userId).ToArray();
                if (flashCards.Length == 0)
                    return Results.BadRequest(new { message = "No flashcards available for learning." });

                var learningCards = flashCards
                    .Select(card => new LearningFlashCard(
                        card.Id,
                        card.ForeignLanguage,
                        card.LocalLanguage,
                        card.Synonyms))
                    .ToArray();

                var session = learningSessionService.CreateSession(userId, request.TaskCount, learningCards);
                return Results.Ok(session);
            })
            .WithTags("LearningSessions")
            .WithName("CreateLearningSession");
    }

    private static bool TryGetUserId(ClaimsPrincipal user, out int userId)
    {
        var idValue = user.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? user.FindFirstValue(JwtRegisteredClaimNames.Sub);

        return int.TryParse(idValue, out userId);
    }

    private sealed record LearningSessionCreateRequest(int TaskCount);
}
