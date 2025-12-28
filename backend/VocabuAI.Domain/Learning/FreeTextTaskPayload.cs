namespace VocabuAI.Domain.Learning;

public sealed record FreeTextTaskPayload(
    int FlashCardId,
    LearningText Question,
    IReadOnlyList<LearningAnswerOption> Answers
);
