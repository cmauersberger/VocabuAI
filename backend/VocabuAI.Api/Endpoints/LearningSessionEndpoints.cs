using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using VocabuAI.Application.Learning;
using VocabuAI.Api.Dtos;
using VocabuAI.Api.Infrastructure;
using VocabuAI.Domain.Learning;
using VocabuAI.Infrastructure.Database.Entities;
using VocabuAI.Infrastructure.Repositories;

namespace VocabuAI.Api.Endpoints;

public static class LearningSessionEndpoints
{
    public static void MapLearningSessionEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/learningSession");
        group.RequireAuthorization();

        var hyphenatedGroup = app.MapGroup("/learning-session");
        hyphenatedGroup.RequireAuthorization();

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

                var flashCards = repository.GetAllWithLearningStateByUserId(userId).ToArray();
                if (flashCards.Length == 0)
                    return Results.BadRequest(new { message = "No flashcards available for learning." });

                var learningCards = flashCards
                    .Select(card =>
                    {
                        var state = card.LearningState;
                        return new LearningFlashCard(
                            card.Id,
                            card.ForeignLanguage,
                            card.LocalLanguage,
                            card.Synonyms,
                            state?.Box ?? 1,
                            state?.CorrectStreak ?? 0,
                            state?.LastAnsweredAt);
                    })
                    .ToArray();

                var session = learningSessionService.CreateSession(userId, request.TaskCount, learningCards);
                return Results.Ok(session);
            })
            .WithTags("LearningSessions")
            .WithName("CreateLearningSession");

        hyphenatedGroup.MapPost("/flashcardAnswered", (
                FlashCardAnsweredRequest request,
                ClaimsPrincipal user,
                IFlashCardRepository flashCardRepository,
                IFlashCardLearningStateRepository learningStateRepository,
                FlashCardLearningProgressService progressService) =>
            {
                if (!TryGetUserId(user, out var userId))
                    return Results.Unauthorized();

                var flashCard = flashCardRepository.GetByIdAndUserId(request.FlashCardId, userId);
                if (flashCard is null)
                    return Results.Unauthorized();

                var learningState = learningStateRepository.GetByFlashCardId(flashCard.Id);
                if (learningState is null)
                {
                    learningState = CreateInitialLearningState(flashCard.Id);
                    learningStateRepository.Add(learningState);
                }

                progressService.ApplyAnswer(learningState, request.LearningTaskType, request.IsCorrect);
                learningStateRepository.SaveChanges();

                return Results.Ok(ToDto(learningState));
            })
            .WithTags("LearningSessions")
            .WithName("FlashCardAnswered");
    }

    private static bool TryGetUserId(ClaimsPrincipal user, out int userId)
    {
        var idValue = user.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? user.FindFirstValue(JwtRegisteredClaimNames.Sub);

        return int.TryParse(idValue, out userId);
    }

    private sealed record LearningSessionCreateRequest(int TaskCount);

    private sealed record FlashCardAnsweredRequest(int FlashCardId, LearningTaskType LearningTaskType, bool IsCorrect);

    private static FlashCardLearningStateDb CreateInitialLearningState(int flashCardId)
        => new()
        {
            FlashCardId = flashCardId,
            Box = 1,
            ProgressPointsInCurrentBox = 0,
            CorrectCountsByQuestionTypeInCurrentBox = new Dictionary<LearningTaskType, int>(),
            CorrectCountTotal = 0,
            WrongCountTotal = 0,
            CorrectStreak = 0,
            LastAnsweredAt = null
        };

    private static FlashCardLearningStateDto ToDto(FlashCardLearningStateDb state)
        => new(
            state.Id,
            state.FlashCardId,
            state.Box,
            state.ProgressPointsInCurrentBox,
            state.CorrectCountsByQuestionTypeInCurrentBox,
            state.CorrectCountTotal,
            state.WrongCountTotal,
            state.CorrectStreak,
            state.LastAnsweredAt);
}
