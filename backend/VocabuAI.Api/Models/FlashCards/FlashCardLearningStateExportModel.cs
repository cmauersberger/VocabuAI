using VocabuAI.Domain.Learning;

namespace VocabuAI.Api.Models.FlashCards;

public sealed record FlashCardLearningStateExportModel(
    int Box,
    int ProgressPointsInCurrentBox,
    Dictionary<LearningTaskType, int> CorrectCountsByQuestionTypeInCurrentBox,
    int CorrectCountTotal,
    int WrongCountTotal,
    int CorrectStreak,
    DateTimeOffset? LastAnsweredAt,
    DateTimeOffset DateTimeCreated
);
