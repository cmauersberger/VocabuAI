using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using VocabuAI.Api.Dtos.FlashCards;
using VocabuAI.Infrastructure.Database.Entities;
using VocabuAI.Infrastructure.Repositories;

namespace VocabuAI.Api.Endpoints;

public static class FlashCardEndpoints
{
    public static void MapFlashCardEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/flashcards");
        group.RequireAuthorization();

        group.MapPost("/createFlashCard", (FlashCardEditDto request, ClaimsPrincipal user, IFlashCardRepository repository) =>
            {
                if (!TryGetUserId(user, out var userId))
                    return Results.Unauthorized();

                if (request.Id != 0)
                    return Results.BadRequest(new { message = "Id must be 0 when creating a flashcard." });

                var validationError = Validate(request);
                if (validationError is not null)
                    return Results.BadRequest(new { message = validationError });

                var flashCard = new FlashCardDb
                {
                    UserId = userId,
                    ForeignLanguage = request.ForeignLanguage.Trim(),
                    LocalLanguage = request.LocalLanguage.Trim(),
                    Synonyms = request.Synonyms?.Trim(),
                    Annotation = request.Annotation?.Trim()
                };

                repository.Add(flashCard);
                repository.SaveChanges();

                return Results.Created(
                    "/api/flashcards/getFlashCards",
                    ToDto(flashCard)
                );
            })
            .WithTags("FlashCards")
            .WithName("CreateFlashCard");

        group.MapPut("/updateFlashCard/{id:int}", (int id, FlashCardEditDto request, ClaimsPrincipal user, IFlashCardRepository repository) =>
            {
                if (!TryGetUserId(user, out var userId))
                    return Results.Unauthorized();

                if (request.Id != 0 && request.Id != id)
                    return Results.BadRequest(new { message = "Id in route and body must match." });

                var validationError = Validate(request);
                if (validationError is not null)
                    return Results.BadRequest(new { message = validationError });

                var flashCard = repository.GetByIdAndUserId(id, userId);
                if (flashCard is null)
                    return Results.NotFound();

                flashCard.ForeignLanguage = request.ForeignLanguage.Trim();
                flashCard.LocalLanguage = request.LocalLanguage.Trim();
                flashCard.Synonyms = request.Synonyms?.Trim();
                flashCard.Annotation = request.Annotation?.Trim();

                repository.Update(flashCard);
                repository.SaveChanges();

                return Results.Ok(ToDto(flashCard));
            })
            .WithTags("FlashCards")
            .WithName("UpdateFlashCard");

        group.MapGet("/getFlashCards", (ClaimsPrincipal user, IFlashCardRepository repository) =>
            {
                if (!TryGetUserId(user, out var userId))
                    return Results.Unauthorized();

                var items = repository.GetAllByUserId(userId)
                    .Select(ToDto)
                    .ToArray();

                return Results.Ok(items);
            })
            .WithTags("FlashCards")
            .WithName("GetFlashCards");
    }

    private static bool TryGetUserId(ClaimsPrincipal user, out int userId)
    {
        var idValue = user.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? user.FindFirstValue(JwtRegisteredClaimNames.Sub);

        return int.TryParse(idValue, out userId);
    }

    private static string? Validate(FlashCardEditDto request)
    {
        if (string.IsNullOrWhiteSpace(request.ForeignLanguage))
            return "ForeignLanguage is required.";
        if (string.IsNullOrWhiteSpace(request.LocalLanguage))
            return "LocalLanguage is required.";
        return null;
    }

    private static FlashCardDto ToDto(FlashCardDb entity)
        => new(
            entity.Id,
            entity.ForeignLanguage,
            entity.LocalLanguage,
            entity.Synonyms,
            entity.Annotation,
            entity.DateTimeCreated,
            entity.DateTimeUpdated
        );
}
