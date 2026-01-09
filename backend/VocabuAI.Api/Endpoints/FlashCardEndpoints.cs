using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using VocabuAI.Api.Dtos.FlashCards;
using VocabuAI.Infrastructure.Database.Entities;
using VocabuAI.Infrastructure.Repositories;
using VocabuAI.Api;

namespace VocabuAI.Api.Endpoints;

public static class FlashCardEndpoints
{
    public static void MapFlashCardEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/flashcards");
        group.RequireAuthorization();

        group.MapPost("/create", (FlashCardEditDto request, ClaimsPrincipal user, IFlashCardRepository repository) =>
            {
                if (!TryGetUserId(user, out var userId))
                    return Results.Unauthorized();

                if (request.Id != 0)
                    return Results.BadRequest(new { message = "Id must be 0 when creating a flashcard." });

                var validationError = Validate(request);
                if (validationError is not null)
                    return Results.BadRequest(new { message = validationError });

                if (!TryNormalizeLanguageCode(request.ForeignLanguageCode, out var foreignCode, out var codeError))
                    return Results.BadRequest(new { message = codeError });
                if (!TryNormalizeLanguageCode(request.LocalLanguageCode, out var localCode, out codeError))
                    return Results.BadRequest(new { message = codeError });

                var flashCard = new FlashCardDb
                {
                    UserId = userId,
                    ForeignLanguage = request.ForeignLanguage.Trim(),
                    LocalLanguage = request.LocalLanguage.Trim(),
                    ForeignLanguageCode = foreignCode,
                    LocalLanguageCode = localCode,
                    Synonyms = request.Synonyms?.Trim(),
                    Annotation = request.Annotation?.Trim()
                };

                repository.Add(flashCard);
                repository.SaveChanges();

                return Results.Created("/api/flashcards/list", ToDto(flashCard));
            })
            .WithTags("FlashCards")
            .WithName("CreateFlashCard");

        group.MapPut("/update/{id:int}", (int id, FlashCardEditDto request, ClaimsPrincipal user, IFlashCardRepository repository) =>
            {
                if (!TryGetUserId(user, out var userId))
                    return Results.Unauthorized();

                if (request.Id != 0 && request.Id != id)
                    return Results.BadRequest(new { message = "Id in route and body must match." });

                var validationError = Validate(request);
                if (validationError is not null)
                    return Results.BadRequest(new { message = validationError });

                if (!TryNormalizeLanguageCode(request.ForeignLanguageCode, out var foreignCode, out var codeError))
                    return Results.BadRequest(new { message = codeError });
                if (!TryNormalizeLanguageCode(request.LocalLanguageCode, out var localCode, out codeError))
                    return Results.BadRequest(new { message = codeError });

                var flashCard = repository.GetByIdWithLearningStateAndUserId(id, userId);
                if (flashCard is null)
                    return Results.NotFound();

                if (!string.Equals(flashCard.ForeignLanguageCode, foreignCode, StringComparison.Ordinal)
                    || !string.Equals(flashCard.LocalLanguageCode, localCode, StringComparison.Ordinal))
                {
                    return Results.BadRequest(new { message = "Language codes cannot be changed for existing flashcards." });
                }

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

        group.MapGet("/list", (ClaimsPrincipal user, IFlashCardRepository repository) =>
            {
                if (!TryGetUserId(user, out var userId))
                    return Results.Unauthorized();

                var items = repository.GetAllWithLearningStateByUserId(userId)
                    .Select(ToDto)
                    .ToArray();

                return Results.Ok(items);
            })
            .WithTags("FlashCards")
            .WithName("GetFlashCards");

        group.MapGet("/count-per-box", (ClaimsPrincipal user, IFlashCardRepository repository) =>
            {
                if (!TryGetUserId(user, out var userId))
                    return Results.Unauthorized();

                var counts = repository.GetCountPerBoxByUserId(userId);
                return Results.Ok(counts);
            })
            .WithTags("FlashCards")
            .WithName("GetFlashCardCountPerBox");

        group.MapPost("/samples/de-to-en", (ClaimsPrincipal user, IFlashCardRepository repository) =>
            {
                if (!TryGetUserId(user, out var userId))
                    return Results.Unauthorized();

                foreach (var sample in SampleFlashCardsDeToEn.Items)
                {
                    var flashCard = new FlashCardDb
                    {
                        UserId = userId,
                        ForeignLanguage = sample.ForeignTerm,
                        LocalLanguage = sample.LocalTerm,
                        ForeignLanguageCode = SampleFlashCardsDeToEn.ForeignLanguageCode,
                        LocalLanguageCode = SampleFlashCardsDeToEn.LocalLanguageCode
                    };

                    repository.Add(flashCard);
                }

                repository.SaveChanges();

                return Results.Ok(new { created = SampleFlashCardsDeToEn.Items.Count });
            })
            .WithTags("FlashCards")
            .WithName("CreateSampleFlashCardsDeToEn");

        group.MapPost("/samples/de-to-fr", (ClaimsPrincipal user, IFlashCardRepository repository) =>
            {
                if (!TryGetUserId(user, out var userId))
                    return Results.Unauthorized();

                foreach (var sample in SampleFlashCardsDeToFr.Items)
                {
                    var flashCard = new FlashCardDb
                    {
                        UserId = userId,
                        ForeignLanguage = sample.ForeignTerm,
                        LocalLanguage = sample.LocalTerm,
                        ForeignLanguageCode = SampleFlashCardsDeToFr.ForeignLanguageCode,
                        LocalLanguageCode = SampleFlashCardsDeToFr.LocalLanguageCode
                    };

                    repository.Add(flashCard);
                }

                repository.SaveChanges();

                return Results.Ok(new { created = SampleFlashCardsDeToFr.Items.Count });
            })
            .WithTags("FlashCards")
            .WithName("CreateSampleFlashCardsDeToFr");
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
            entity.ForeignLanguageCode,
            entity.LocalLanguageCode,
            entity.Synonyms,
            entity.Annotation,
            entity.LearningState?.Box ?? 1,
            entity.LearningState?.LastAnsweredAt,
            entity.DateTimeCreated,
            entity.DateTimeUpdated
        );

    private static bool TryNormalizeLanguageCode(string? value, out string normalized, out string error)
    {
        normalized = value?.Trim() ?? "";
        if (string.IsNullOrWhiteSpace(normalized))
        {
            error = "Language code is required.";
            return false;
        }

        try
        {
            if (IsInvariantGlobalization())
            {
                if (!IsBasicLanguageCode(normalized))
                {
                    error = "Language code is invalid.";
                    return false;
                }
            }
            else
            {
                normalized = CultureInfo.GetCultureInfo(normalized).Name;
            }
        }
        catch (CultureNotFoundException)
        {
            error = "Language code is invalid.";
            return false;
        }

        error = "";
        return true;
    }

    private static bool IsInvariantGlobalization()
        => AppContext.TryGetSwitch("System.Globalization.Invariant", out var invariant) && invariant;

    private static bool IsBasicLanguageCode(string value)
    {
        for (var i = 0; i < value.Length; i++)
        {
            var ch = value[i];
            var isAlphaNum = (ch >= 'a' && ch <= 'z')
                || (ch >= 'A' && ch <= 'Z')
                || (ch >= '0' && ch <= '9');
            if (isAlphaNum)
            {
                continue;
            }

            if (ch == '-' && i > 0 && i < value.Length - 1)
            {
                continue;
            }

            return false;
        }

        return true;
    }
}
