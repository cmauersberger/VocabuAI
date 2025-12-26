namespace VocabuAI.Domain.Learning;

public sealed record MappingTaskPayload(
    IReadOnlyList<LearningMappingItem> Items
);
