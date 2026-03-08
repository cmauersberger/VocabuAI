using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using VocabuAI.Application.Learning;
using VocabuAI.Application.Learning.Generation;
using VocabuAI.Application.Learning.Generation.Contracts;
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
        var group = app.MapGroup("/learning-session");
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

        group.MapPost("/generate-text", async (
                GenerateTextRequestDto request,
                ClaimsPrincipal user,
                LearningSessionAiService aiService,
                IGeneratedLearningTextRepository generatedLearningTextRepository,
                CancellationToken cancellationToken) =>
            {
                if (!TryGetUserId(user, out var userId))
                    return Results.Unauthorized();

                try
                {
                    var result = await aiService.GenerateTextAsync(userId, request, cancellationToken);

                    if (result.Response.IsValid &&
                        !string.IsNullOrWhiteSpace(result.Response.Text) &&
                        !string.IsNullOrWhiteSpace(result.Prompt))
                    {
                        generatedLearningTextRepository.Add(new GeneratedLearningTextDb
                        {
                            UserId = userId,
                            Prompt = result.Prompt,
                            Text = result.Response.Text,
                            Provider = result.Response.Provider.ToApiValue()
                        });
                        await generatedLearningTextRepository.SaveChangesAsync(cancellationToken);
                    }

                    return Results.Ok(result.Response);
                }
                catch (OpenAiBudgetExceededException ex)
                {
                    return Results.BadRequest(new { code = OpenAiBudgetExceededException.ErrorCode, message = ex.Message });
                }
                catch (CryptographicException)
                {
                    return Results.BadRequest(new { message = "OpenAI key could not be decrypted. Please re-save it in Settings." });
                }
                catch (FormatException)
                {
                    return Results.BadRequest(new { message = "OpenAI key could not be decrypted. Please re-save it in Settings." });
                }
                catch (InvalidOperationException ex)
                {
                    return Results.BadRequest(new { message = ex.Message });
                }
            })
            .WithTags("LearningSessions")
            .WithName("GenerateLearningText");

        group.MapPost("/generate-text-stream", async (
                GenerateTextRequestDto request,
                ClaimsPrincipal user,
                LearningSessionAiService aiService,
                IGeneratedLearningTextRepository generatedLearningTextRepository,
                HttpResponse response,
                CancellationToken cancellationToken) =>
            {
                if (!TryGetUserId(user, out var userId))
                {
                    response.StatusCode = StatusCodes.Status401Unauthorized;
                    return;
                }

                response.Headers.CacheControl = "no-cache";
                response.Headers.Connection = "keep-alive";
                response.ContentType = "text/event-stream";

                string? errorMessage;
                string? prompt;
                IAsyncEnumerable<string>? stream;

                try
                {
                    (errorMessage, prompt, stream) = await aiService.GenerateTextStreamAsync(
                        userId,
                        request,
                        cancellationToken);
                }
                catch (InvalidOperationException ex)
                {
                    await WriteSseEventAsync(response, "error", ex.Message, cancellationToken);
                    return;
                }

                if (!string.IsNullOrWhiteSpace(errorMessage) || stream is null)
                {
                    await WriteSseEventAsync(response, "error", errorMessage ?? "Unable to start stream.", cancellationToken);
                    return;
                }

                var generatedTextBuilder = new StringBuilder();
                await foreach (var chunk in stream.WithCancellation(cancellationToken))
                {
                    generatedTextBuilder.Append(chunk);
                    await WriteSseEventAsync(response, "message", chunk, cancellationToken);
                }

                if (!string.IsNullOrWhiteSpace(prompt) && generatedTextBuilder.Length > 0)
                {
                    generatedLearningTextRepository.Add(new GeneratedLearningTextDb
                    {
                        UserId = userId,
                        Prompt = prompt,
                        Text = generatedTextBuilder.ToString(),
                        Provider = AiProvider.Ollama.ToApiValue()
                    });
                    await generatedLearningTextRepository.SaveChangesAsync(cancellationToken);
                }

                await WriteSseEventAsync(response, "done", "", cancellationToken);
            })
            .WithTags("LearningSessions")
            .WithName("GenerateLearningTextStream");

        group.MapGet("/generated-text-history/list", (
                ClaimsPrincipal user,
                IGeneratedLearningTextRepository generatedLearningTextRepository) =>
            {
                if (!TryGetUserId(user, out var userId))
                    return Results.Unauthorized();

                var items = generatedLearningTextRepository.GetAllByUserId(userId)
                    .Select(ToDto)
                    .ToArray();
                return Results.Ok(items);
            })
            .WithTags("LearningSessions")
            .WithName("GetGeneratedLearningTextHistory");

        group.MapDelete("/generated-text-history/delete/{id:int}", (
                int id,
                ClaimsPrincipal user,
                IGeneratedLearningTextRepository generatedLearningTextRepository) =>
            {
                if (!TryGetUserId(user, out var userId))
                    return Results.Unauthorized();

                var item = generatedLearningTextRepository.GetByIdAndUserId(id, userId);
                if (item is null)
                    return Results.NotFound(new { message = "Generated text not found." });

                generatedLearningTextRepository.Remove(item);
                generatedLearningTextRepository.SaveChanges();
                return Results.NoContent();
            })
            .WithTags("LearningSessions")
            .WithName("DeleteGeneratedLearningText");

        group.MapPost("/flashcard-answered", (
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
                    // we need to save here to set the CreatedAt/UpdatedAt fields for the new entity
                    learningStateRepository.SaveChanges();
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

    private static GeneratedLearningTextDto ToDto(GeneratedLearningTextDb entity)
        => new(
            entity.Id,
            entity.Prompt,
            entity.Text,
            entity.Provider,
            entity.DateTimeCreated);

    private static async Task WriteSseEventAsync(
        HttpResponse response,
        string eventName,
        string data,
        CancellationToken cancellationToken)
    {
        await response.WriteAsync($"event: {eventName}\n", cancellationToken);

        var normalized = data.Replace("\r\n", "\n");
        var lines = normalized.Split('\n');
        foreach (var line in lines)
        {
            await response.WriteAsync($"data: {line}\n", cancellationToken);
        }

        await response.WriteAsync("\n", cancellationToken);
        await response.Body.FlushAsync(cancellationToken);
    }
}
