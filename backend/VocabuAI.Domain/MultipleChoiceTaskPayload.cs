namespace VocabuAI.Domain.Learning;

public sealed record MultipleChoiceTaskPayload(
    LearningSelectionMode SelectionMode,
    LearningText Question,
    IReadOnlyList<LearningAnswerOption> Options
);
