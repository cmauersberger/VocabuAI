using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
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

        group.MapPost("/create", (LearningSessionCreateRequest request, ClaimsPrincipal user, IFlashCardRepository repository) =>
            {
                if (!TryGetUserId(user, out var userId))
                    return Results.Unauthorized();

                if (request.TaskCount <= 0)
                    return Results.BadRequest(new { message = "TaskCount must be greater than 0." });

                var flashCards = repository.GetAllByUserId(userId).ToArray();
                if (flashCards.Length == 0)
                    return Results.BadRequest(new { message = "No flashcards available for learning." });

                var session = BuildLearningSession(userId, request.TaskCount, flashCards);
                return Results.Ok(session);
            })
            .WithTags("LearningSessions")
            .WithName("CreateLearningSession");
    }

    private static LearningSession BuildLearningSession(int userId, int taskCount, IReadOnlyList<FlashCardDb> flashCards)
    {
        var random = Random.Shared;

        // Keep this isolated so smarter learning selection can replace it later.
        var tasks = BuildRandomTasks(taskCount, flashCards, random);

        return new LearningSession
        {
            Guid = Guid.NewGuid(),
            UserId = userId,
            CreatedAt = DateTimeOffset.UtcNow,
            Tasks = tasks
        };
    }

    private static IReadOnlyList<LearningTask> BuildRandomTasks(int taskCount, IReadOnlyList<FlashCardDb> flashCards, Random random)
    {
        var tasks = new List<LearningTask>(taskCount);

        for (var i = 0; i < taskCount; i++)
        {
            var taskType = PickTaskType(random);
            tasks.Add(CreateTask(taskType, flashCards, random));
        }

        return tasks;
    }

    private static LearningTask CreateTask(LearningTaskType taskType, IReadOnlyList<FlashCardDb> flashCards, Random random)
    {
        var flashCard = PickRandomFlashCard(flashCards, random);

        return taskType switch
        {
            LearningTaskType.FreeText => new LearningTask
            {
                Guid = Guid.NewGuid(),
                TaskType = LearningTaskType.FreeText,
                Payload = CreateFreeTextPayload(flashCard, random)
            },
            LearningTaskType.MultipleChoice => new LearningTask
            {
                Guid = Guid.NewGuid(),
                TaskType = LearningTaskType.MultipleChoice,
                Payload = CreateMultipleChoicePayload(flashCard, flashCards, random)
            },
            LearningTaskType.Mapping => new LearningTask
            {
                Guid = Guid.NewGuid(),
                TaskType = LearningTaskType.Mapping,
                Payload = CreateMappingPayload(flashCards, random)
            },
            _ => throw new ArgumentOutOfRangeException(nameof(taskType), taskType, "Unsupported learning task type.")
        };
    }

    private static FreeTextTaskPayload CreateFreeTextPayload(FlashCardDb flashCard, Random random)
    {
        var questionLanguage = random.Next(2) == 0 ? LearningLanguage.Foreign : LearningLanguage.Local;
        var answerLanguage = questionLanguage == LearningLanguage.Foreign ? LearningLanguage.Local : LearningLanguage.Foreign;

        var questionValue = GetValueForLanguage(flashCard, questionLanguage);
        var answerValue = GetValueForLanguage(flashCard, answerLanguage);
        var answers = BuildAnswerOptions(answerLanguage, answerValue, flashCard.Synonyms);

        return new FreeTextTaskPayload(
            new LearningText(questionLanguage, questionValue),
            answers
        );
    }

    private static MultipleChoiceTaskPayload CreateMultipleChoicePayload(
        FlashCardDb flashCard,
        IReadOnlyList<FlashCardDb> flashCards,
        Random random)
    {
        var questionLanguage = random.Next(2) == 0 ? LearningLanguage.Foreign : LearningLanguage.Local;
        var answerLanguage = questionLanguage == LearningLanguage.Foreign ? LearningLanguage.Local : LearningLanguage.Foreign;

        var questionValue = GetValueForLanguage(flashCard, questionLanguage);
        var answerValue = GetValueForLanguage(flashCard, answerLanguage);
        var correctOptions = BuildAnswerOptions(answerLanguage, answerValue, flashCard.Synonyms).ToList();

        var incorrectOptionCount = Math.Min(3, Math.Max(0, flashCards.Count - 1));
        var incorrectCards = PickRandomFlashCards(flashCards, incorrectOptionCount, random, flashCard.Id);
        var incorrectOptions = incorrectCards
            .Select(card => GetValueForLanguage(card, answerLanguage))
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Where(value => correctOptions.All(option => !string.Equals(option.Value, value, StringComparison.OrdinalIgnoreCase)))
            .Select(value => new LearningAnswerOption(value, false))
            .ToList();

        var options = correctOptions.Concat(incorrectOptions).ToList();
        Shuffle(options, random);

        return new MultipleChoiceTaskPayload(
            LearningSelectionMode.Single,
            new LearningText(questionLanguage, questionValue),
            options
        );
    }

    private static MappingTaskPayload CreateMappingPayload(IReadOnlyList<FlashCardDb> flashCards, Random random)
    {
        var pairCount = Math.Min(4, flashCards.Count);
        var selectedCards = PickRandomFlashCards(flashCards, pairCount, random);

        var items = selectedCards
            .Select(card => new LearningMappingItem(
                new LearningText(LearningLanguage.Foreign, card.ForeignLanguage),
                new LearningText(LearningLanguage.Local, card.LocalLanguage)))
            .ToArray();

        return new MappingTaskPayload(items);
    }

    private static IReadOnlyList<LearningAnswerOption> BuildAnswerOptions(
        LearningLanguage answerLanguage,
        string answerValue,
        string? synonyms)
    {
        var values = new List<string> { answerValue };

        if (answerLanguage == LearningLanguage.Local)
        {
            foreach (var synonym in ParseSynonyms(synonyms))
            {
                values.Add(synonym);
            }
        }

        var uniqueValues = values
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Select(value => value.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        return uniqueValues
            .Select(value => new LearningAnswerOption(value, true))
            .ToArray();
    }

    private static IEnumerable<string> ParseSynonyms(string? synonyms)
    {
        if (string.IsNullOrWhiteSpace(synonyms))
            yield break;

        var parts = synonyms.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries);
        foreach (var part in parts)
        {
            var trimmed = part.Trim();
            if (!string.IsNullOrWhiteSpace(trimmed))
                yield return trimmed;
        }
    }

    private static FlashCardDb PickRandomFlashCard(IReadOnlyList<FlashCardDb> flashCards, Random random)
        => flashCards[random.Next(flashCards.Count)];

    private static List<FlashCardDb> PickRandomFlashCards(
        IReadOnlyList<FlashCardDb> flashCards,
        int count,
        Random random,
        int? excludeId = null)
    {
        var pool = flashCards
            .Where(card => excludeId is null || card.Id != excludeId.Value)
            .ToList();

        if (pool.Count <= count)
        {
            Shuffle(pool, random);
            return pool;
        }

        Shuffle(pool, random);
        return pool.Take(count).ToList();
    }

    private static string GetValueForLanguage(FlashCardDb flashCard, LearningLanguage language)
        => language == LearningLanguage.Foreign ? flashCard.ForeignLanguage : flashCard.LocalLanguage;

    private static void Shuffle<T>(IList<T> items, Random random)
    {
        for (var i = items.Count - 1; i > 0; i--)
        {
            var swapIndex = random.Next(i + 1);
            (items[i], items[swapIndex]) = (items[swapIndex], items[i]);
        }
    }

    private static LearningTaskType PickTaskType(Random random)
        => random.Next(3) switch
        {
            0 => LearningTaskType.FreeText,
            1 => LearningTaskType.MultipleChoice,
            _ => LearningTaskType.Mapping
        };

    private static bool TryGetUserId(ClaimsPrincipal user, out int userId)
    {
        var idValue = user.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? user.FindFirstValue(JwtRegisteredClaimNames.Sub);

        return int.TryParse(idValue, out userId);
    }

    private sealed record LearningSessionCreateRequest(int TaskCount);
}
