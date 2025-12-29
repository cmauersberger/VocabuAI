using VocabuAI.Domain.Learning;

namespace VocabuAI.Application.Learning;

public sealed class LearningSessionService : ILearningSessionService
{
    private const int BOX_1_PERCENT = 40;
    private const int BOX_2_PERCENT = 30;
    private const int BOX_3_PERCENT = 15;
    private const int BOX_4_PERCENT = 10;
    private const int BOX_5_PERCENT = 5;

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
        var selectedCards = SelectFlashCardsForSession(taskCount, flashCards);
        var tasks = new List<LearningTask>(selectedCards.Count);

        foreach (var flashCard in selectedCards)
        {
            var taskType = PickTaskType(random);
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

    private static IReadOnlyList<LearningFlashCard> SelectFlashCardsForSession(
        int taskCount,
        IReadOnlyList<LearningFlashCard> flashCards)
    {
        var quotas = CalculateBoxQuotas(taskCount);
        var orderedByBox = BuildOrderedCandidatesByBox(flashCards, quotas);
        var selected = new List<LearningFlashCard>(Math.Min(taskCount, flashCards.Count));
        var selectedIds = new HashSet<int>();

        for (var box = 1; box <= LearningConstants.MAX_BOX; box++)
        {
            if (!orderedByBox.TryGetValue(box, out var candidates))
                continue;

            AddUpToLimit(selected, selectedIds, candidates, quotas[box]);
        }

        for (var box = 1; box <= LearningConstants.MAX_BOX && selected.Count < taskCount; box++)
        {
            if (!orderedByBox.TryGetValue(box, out var candidates))
                continue;

            var remaining = taskCount - selected.Count;
            AddUpToLimit(selected, selectedIds, candidates, remaining);
        }

        return selected;
    }

    private static IReadOnlyDictionary<int, int> CalculateBoxQuotas(int taskCount)
    {
        var percentages = new Dictionary<int, int>
        {
            [1] = BOX_1_PERCENT,
            [2] = BOX_2_PERCENT,
            [3] = BOX_3_PERCENT,
            [4] = BOX_4_PERCENT,
            [5] = BOX_5_PERCENT
        };

        var quotas = new Dictionary<int, int>(percentages.Count);
        var fractionalParts = new List<(int Box, double Fraction)>(percentages.Count);
        var baseTotal = 0;

        foreach (var entry in percentages)
        {
            var exact = taskCount * entry.Value / 100.0;
            var baseQuota = (int)Math.Floor(exact);
            quotas[entry.Key] = baseQuota;
            baseTotal += baseQuota;
            fractionalParts.Add((entry.Key, exact - baseQuota));
        }

        var remaining = taskCount - baseTotal;
        foreach (var entry in fractionalParts
                     .OrderByDescending(item => item.Fraction)
                     .ThenBy(item => item.Box))
        {
            if (remaining <= 0)
                break;

            quotas[entry.Box]++;
            remaining--;
        }

        return quotas;
    }

    private static IReadOnlyDictionary<int, List<LearningFlashCard>> BuildOrderedCandidatesByBox(
        IReadOnlyList<LearningFlashCard> flashCards,
        IReadOnlyDictionary<int, int> quotas)
    {
        var candidates = new Dictionary<int, List<LearningFlashCard>>();

        for (var box = 1; box <= LearningConstants.MAX_BOX; box++)
        {
            var boxCards = flashCards
                .Where(card => card.Box == box)
                .ToList();

            if (boxCards.Count == 0)
            {
                candidates[box] = new List<LearningFlashCard>();
                continue;
            }

            candidates[box] = box == 1
                ? OrderBoxOneCandidates(boxCards, quotas[box])
                : OrderHigherBoxCandidates(boxCards);
        }

        return candidates;
    }

    private static List<LearningFlashCard> OrderBoxOneCandidates(
        IReadOnlyList<LearningFlashCard> boxCards,
        int boxQuota)
    {
        var newItems = boxCards
            .Where(card => card.LastAnsweredAt is null)
            .OrderBy(card => card.Id)
            .ToList();

        var failedItems = boxCards
            .Where(card => card.LastAnsweredAt is not null && card.CorrectStreak == 0)
            .OrderBy(card => card.LastAnsweredAt)
            .ThenBy(card => card.Id)
            .ToList();

        var failedCap = boxQuota / 2;
        var cappedFailed = failedItems.Take(failedCap).ToList();
        var excludedIds = new HashSet<int>(newItems.Select(card => card.Id));
        foreach (var card in cappedFailed)
        {
            excludedIds.Add(card.Id);
        }

        var remainingItems = boxCards
            .Where(card => !excludedIds.Contains(card.Id))
            .OrderBy(card => card.LastAnsweredAt ?? DateTimeOffset.MinValue)
            .ThenBy(card => card.Id)
            .ToList();

        return newItems
            .Concat(cappedFailed)
            .Concat(remainingItems)
            .ToList();
    }

    private static List<LearningFlashCard> OrderHigherBoxCandidates(IReadOnlyList<LearningFlashCard> boxCards)
        => boxCards
            .OrderBy(card => card.LastAnsweredAt ?? DateTimeOffset.MinValue)
            .ThenBy(card => card.Id)
            .ToList();

    private static void AddUpToLimit(
        List<LearningFlashCard> selected,
        HashSet<int> selectedIds,
        IReadOnlyList<LearningFlashCard> candidates,
        int maxToAdd)
    {
        if (maxToAdd <= 0)
            return;

        var remaining = maxToAdd;
        foreach (var card in candidates)
        {
            if (remaining <= 0)
                break;

            if (selectedIds.Add(card.Id))
            {
                selected.Add(card);
                remaining--;
            }
        }
    }

    private static LearningTaskType PickTaskType(Random random)
        => random.Next(3) switch
        {
            0 => LearningTaskType.FreeText,
            1 => LearningTaskType.MultipleChoice,
            _ => LearningTaskType.Mapping
        };
}
