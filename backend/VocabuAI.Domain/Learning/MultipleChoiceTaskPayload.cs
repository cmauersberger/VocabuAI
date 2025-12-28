namespace VocabuAI.Domain.Learning;

public sealed record MultipleChoiceTaskPayload(
    int FlashCardId,
    LearningSelectionMode SelectionMode,
    LearningText Question,
    IReadOnlyList<LearningAnswerOption> Options
);
