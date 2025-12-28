using VocabuAI.Domain.Learning;

namespace VocabuAI.Api.Dtos;

// Keep in sync with frontend/src/domain/dtos/FlashCardLearningStateDto.ts
public sealed record FlashCardLearningStateDto(
    int Id,
    int FlashCardId,
    int Box,
    int ProgressPointsInCurrentBox,
    Dictionary<LearningTaskType, int> CorrectCountsByQuestionTypeInCurrentBox,
    int CorrectCountTotal,
    int WrongCountTotal,
    int CorrectStreak,
    DateTimeOffset? LastAnsweredAt);
