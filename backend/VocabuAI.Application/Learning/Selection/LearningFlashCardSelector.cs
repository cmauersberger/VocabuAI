using VocabuAI.Domain.Learning;

namespace VocabuAI.Application.Learning.Selection;

internal static class LearningFlashCardSelector
{
    private const int BOX_1_PERCENT = 40;
    private const int BOX_2_PERCENT = 30;
    private const int BOX_3_PERCENT = 15;
    private const int BOX_4_PERCENT = 10;
    private const int BOX_5_PERCENT = 5;

    public static IReadOnlyList<LearningFlashCard> SelectFlashCardsForSession(
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
}
