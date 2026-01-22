using VocabuAI.Domain.Learning;

namespace VocabuAI.Application.Learning;

public sealed class LearningSessionService : ILearningSessionService
{
    private static readonly IReadOnlyDictionary<int, IReadOnlyDictionary<LearningTaskType, int>> TaskTypeSharesByBox =
        new Dictionary<int, IReadOnlyDictionary<LearningTaskType, int>>
        {
            [1] = new Dictionary<LearningTaskType, int>
            {
                [LearningTaskType.FreeText] = 34,
                [LearningTaskType.MultipleChoice] = 33,
                [LearningTaskType.Mapping] = 33
            },
            [2] = new Dictionary<LearningTaskType, int>
            {
                [LearningTaskType.FreeText] = 34,
                [LearningTaskType.MultipleChoice] = 33,
                [LearningTaskType.Mapping] = 33
            },
            [3] = new Dictionary<LearningTaskType, int>
            {
                [LearningTaskType.FreeText] = 50,
                [LearningTaskType.MultipleChoice] = 30,
                [LearningTaskType.Mapping] = 20
            },
            [4] = new Dictionary<LearningTaskType, int>
            {
                [LearningTaskType.FreeText] = 60,
                [LearningTaskType.MultipleChoice] = 25,
                [LearningTaskType.Mapping] = 15
            },
            [5] = new Dictionary<LearningTaskType, int>
            {
                [LearningTaskType.FreeText] = 70,
                [LearningTaskType.MultipleChoice] = 20,
                [LearningTaskType.Mapping] = 10
            }
        };

    public LearningSession CreateSession(int userId, int taskCount, IReadOnlyList<LearningFlashCard> flashCards)
    {
        if (taskCount <= 0)
            throw new ArgumentOutOfRangeException(nameof(taskCount), "Task count must be greater than zero.");
        if (flashCards.Count == 0)
            throw new ArgumentException("Flashcards are required to build a learning session.", nameof(flashCards));

        var random = Random.Shared;

        var tasks = BuildLearningStateTasks(taskCount, flashCards, random);

        return new LearningSession
        {
            Guid = Guid.NewGuid(),
            UserId = userId,
            CreatedAt = DateTimeOffset.UtcNow,
            Tasks = tasks
        };
    }

    private static IReadOnlyList<LearningTask> BuildLearningStateTasks(
        int taskCount,
        IReadOnlyList<LearningFlashCard> flashCards,
        Random random)
    {
        var selectedCards = Selection.LearningFlashCardSelector.SelectFlashCardsForSession(taskCount, flashCards);
        var tasks = new List<LearningTask>(selectedCards.Count);

        foreach (var flashCard in selectedCards)
        {
            var taskType = PickTaskTypeForBox(random, flashCard.Box);
            tasks.Add(CreateTask(taskType, flashCard, flashCards, random));
        }

        Shuffle(tasks, random);
        return tasks;
    }

    private static LearningTask CreateTask(
        LearningTaskType taskType,
        LearningFlashCard flashCard,
        IReadOnlyList<LearningFlashCard> flashCards,
        Random random)
    {
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
                Payload = CreateMappingPayload(flashCard, flashCards, random)
            },
            _ => throw new ArgumentOutOfRangeException(nameof(taskType), taskType, "Unsupported learning task type.")
        };
    }

    private static FreeTextTaskPayload CreateFreeTextPayload(LearningFlashCard flashCard, Random random)
    {
        var questionLanguage = random.Next(2) == 0 ? LearningLanguage.Foreign : LearningLanguage.Local;
        var answerLanguage = questionLanguage == LearningLanguage.Foreign ? LearningLanguage.Local : LearningLanguage.Foreign;

        var questionValue = GetValueForLanguage(flashCard, questionLanguage);
        var answerValue = GetValueForLanguage(flashCard, answerLanguage);
        var answers = BuildAnswerOptions(answerLanguage, answerValue, flashCard.Synonyms);

        return new FreeTextTaskPayload(
            flashCard.Id,
            new LearningText(questionLanguage, questionValue),
            answers
        );
    }

    private static MultipleChoiceTaskPayload CreateMultipleChoicePayload(
        LearningFlashCard flashCard,
        IReadOnlyList<LearningFlashCard> flashCards,
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
            flashCard.Id,
            LearningSelectionMode.Single,
            new LearningText(questionLanguage, questionValue),
            options
        );
    }

    private static MappingTaskPayload CreateMappingPayload(
        LearningFlashCard flashCard,
        IReadOnlyList<LearningFlashCard> flashCards,
        Random random)
    {
        var pairCount = Math.Min(4, flashCards.Count);
        var selectedCards = new List<LearningFlashCard>(pairCount) { flashCard };

        if (pairCount > 1)
        {
            var additionalCards = PickRandomFlashCards(flashCards, pairCount - 1, random, flashCard.Id);
            selectedCards.AddRange(additionalCards);
        }

        var items = selectedCards
            .Select(card => new LearningMappingItem(
                card.Id,
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

    private static List<LearningFlashCard> PickRandomFlashCards(
        IReadOnlyList<LearningFlashCard> flashCards,
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

    private static string GetValueForLanguage(LearningFlashCard flashCard, LearningLanguage language)
        => language == LearningLanguage.Foreign ? flashCard.ForeignLanguage : flashCard.LocalLanguage;

    private static void Shuffle<T>(IList<T> items, Random random)
    {
        for (var i = items.Count - 1; i > 0; i--)
        {
            var swapIndex = random.Next(i + 1);
            (items[i], items[swapIndex]) = (items[swapIndex], items[i]);
        }
    }

    private static LearningTaskType PickTaskTypeForBox(Random random, int box)
    {
        if (!TaskTypeSharesByBox.TryGetValue(box, out var shares))
        {
            shares = TaskTypeSharesByBox[LearningConstants.MAX_BOX];
        }

        var freeTextPercent = shares[LearningTaskType.FreeText];
        var multipleChoicePercent = shares[LearningTaskType.MultipleChoice];
        var mappingPercent = shares[LearningTaskType.Mapping];
        var total = freeTextPercent + multipleChoicePercent + mappingPercent;
        if (total <= 0)
            return LearningTaskType.FreeText;

        var roll = random.Next(total);
        if (roll < freeTextPercent)
            return LearningTaskType.FreeText;
        if (roll < freeTextPercent + multipleChoicePercent)
            return LearningTaskType.MultipleChoice;
        return LearningTaskType.Mapping;
    }
}
