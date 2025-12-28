namespace VocabuAI.Domain.Learning;

public sealed record LearningMappingItem(
    int FlashCardId,
    LearningText Left,
    LearningText Right
);
