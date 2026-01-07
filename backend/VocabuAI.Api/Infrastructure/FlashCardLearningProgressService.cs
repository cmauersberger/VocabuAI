using VocabuAI.Domain.Learning;
using VocabuAI.Infrastructure.Database.Entities;

namespace VocabuAI.Api.Infrastructure;

public sealed class FlashCardLearningProgressService
{
    private static readonly IReadOnlyDictionary<int, AdvancementRule> AdvancementRules = new Dictionary<int, AdvancementRule>
    {
        {
            1,
            new AdvancementRule(
                CurrentBox: 1,
                RequiredProgressPoints: 2,
                MinimumCorrectCountsByTaskType: new Dictionary<LearningTaskType, int>(),
                MinimumElapsedSinceCreated: TimeSpan.FromDays(5))
        },
        {
            2,
            new AdvancementRule(
                CurrentBox: 2,
                RequiredProgressPoints: 5,
                MinimumCorrectCountsByTaskType: new Dictionary<LearningTaskType, int>
                {
                    [LearningTaskType.FreeText] = 2,
                    [LearningTaskType.MultipleChoice] = 2
                },
                MinimumElapsedSinceCreated: TimeSpan.FromDays(14))
        },
        {
            3,
            new AdvancementRule(
                CurrentBox: 3,
                RequiredProgressPoints: 10,
                MinimumCorrectCountsByTaskType: new Dictionary<LearningTaskType, int>
                {
                    [LearningTaskType.FreeText] = 3
                },
                MinimumElapsedSinceCreated: TimeSpan.FromDays(40))
        },
        {
            4,
            new AdvancementRule(
                CurrentBox: 4,
                RequiredProgressPoints: 15,
                MinimumCorrectCountsByTaskType: new Dictionary<LearningTaskType, int>
                {
                    [LearningTaskType.FreeText] = 4
                },
                MinimumElapsedSinceCreated: TimeSpan.FromDays(90))
        }
    };

    private static readonly IReadOnlyDictionary<LearningTaskType, int> ProgressPointsByTaskType = new Dictionary<LearningTaskType, int>
    {
        [LearningTaskType.MultipleChoice] = 1,
        [LearningTaskType.Mapping] = 2,
        [LearningTaskType.FreeText] = 3
    };

    public void ApplyAnswer(FlashCardLearningStateDb state, LearningTaskType taskType, bool isCorrect)
    {
        state.LastAnsweredAt = DateTimeOffset.UtcNow;

        if (!isCorrect)
        {
            state.WrongCountTotal++;
            ResetAfterIncorrect(state);
            return;
        }

        state.CorrectCountTotal++;
        state.CorrectStreak++;
        state.ProgressPointsInCurrentBox += GetProgressPoints(taskType);
        IncrementTaskTypeCount(state, taskType);

        if (state.Box >= LearningConstants.MAX_BOX)
        {
            return;
        }

        if (AdvancementRules.TryGetValue(state.Box, out var rule) && rule.IsSatisfiedBy(state))
        {
            state.Box++;
            ResetForNewBox(state);
        }
    }

    private static int GetProgressPoints(LearningTaskType taskType)
        => ProgressPointsByTaskType.TryGetValue(taskType, out var points) ? points : 0;

    private static void IncrementTaskTypeCount(FlashCardLearningStateDb state, LearningTaskType taskType)
    {
        if (state.CorrectCountsByQuestionTypeInCurrentBox.TryGetValue(taskType, out var current))
        {
            state.CorrectCountsByQuestionTypeInCurrentBox[taskType] = current + 1;
            return;
        }

        state.CorrectCountsByQuestionTypeInCurrentBox[taskType] = 1;
    }

    private static void ResetAfterIncorrect(FlashCardLearningStateDb state)
    {
        state.Box = 1;
        ResetForNewBox(state);
    }

    private static void ResetForNewBox(FlashCardLearningStateDb state)
    {
        state.ProgressPointsInCurrentBox = 0;
        state.CorrectCountsByQuestionTypeInCurrentBox = new Dictionary<LearningTaskType, int>();
        state.CorrectStreak = 0;
    }

    private sealed record AdvancementRule(
        int CurrentBox,
        int RequiredProgressPoints,
        IReadOnlyDictionary<LearningTaskType, int> MinimumCorrectCountsByTaskType,
        TimeSpan MinimumElapsedSinceCreated)
    {
        public bool IsSatisfiedBy(FlashCardLearningStateDb state)
        {
            if (state.ProgressPointsInCurrentBox < RequiredProgressPoints)
            {
                return false;
            }

            if (!MeetsMinimumAge(state))
            {
                return false;
            }

            foreach (var requirement in MinimumCorrectCountsByTaskType)
            {
                if (!state.CorrectCountsByQuestionTypeInCurrentBox.TryGetValue(requirement.Key, out var current)
                    || current < requirement.Value)
                {
                    return false;
                }
            }

            return true;
        }

        private bool MeetsMinimumAge(FlashCardLearningStateDb state)
        {
            var firstLearnedAt = state.DateTimeCreated;

            var minEligibleAt = firstLearnedAt.Add(MinimumElapsedSinceCreated);
            if (DateTimeOffset.UtcNow < minEligibleAt)
            {
                return false;
            }

            return true;
        }
    }
}
