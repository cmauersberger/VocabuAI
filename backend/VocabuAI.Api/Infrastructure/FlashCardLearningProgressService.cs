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
                currentBox: 1,
                requiredProgressPoints: 2,
                minimumCorrectCountsByTaskType: new Dictionary<LearningTaskType, int>())
        },
        {
            2,
            new AdvancementRule(
                currentBox: 2,
                requiredProgressPoints: 5,
                minimumCorrectCountsByTaskType: new Dictionary<LearningTaskType, int>())
        },
        {
            3,
            new AdvancementRule(
                currentBox: 3,
                requiredProgressPoints: 10,
                minimumCorrectCountsByTaskType: new Dictionary<LearningTaskType, int>
                {
                    [LearningTaskType.FreeText] = 2
                })
        },
        {
            4,
            new AdvancementRule(
                currentBox: 4,
                requiredProgressPoints: 15,
                minimumCorrectCountsByTaskType: new Dictionary<LearningTaskType, int>
                {
                    [LearningTaskType.FreeText] = 3
                })
        }
    };

    private static readonly IReadOnlyDictionary<LearningTaskType, int> ProgressPointsByTaskType = new Dictionary<LearningTaskType, int>
    {
        [LearningTaskType.MultipleChoice] = 1,
        [LearningTaskType.Mapping] = 2,
        [LearningTaskType.FreeText] = 3
    };

    public void ApplyAnswer(FlashCardLearningStateDb state, LearningTaskType taskType, bool isCorrect, DateTimeOffset answeredAt)
    {
        state.LastAnsweredAt = answeredAt;

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
        IReadOnlyDictionary<LearningTaskType, int> MinimumCorrectCountsByTaskType)
    {
        public bool IsSatisfiedBy(FlashCardLearningStateDb state)
        {
            if (state.ProgressPointsInCurrentBox < RequiredProgressPoints)
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
    }
}
