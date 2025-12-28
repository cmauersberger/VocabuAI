namespace VocabuAI.Domain.Learning;

public sealed record FreeTextTaskPayload(
    LearningText Question,
    IReadOnlyList<LearningAnswerOption> Answers
);
