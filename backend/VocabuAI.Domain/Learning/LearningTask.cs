namespace VocabuAI.Domain.Learning;

public sealed class LearningTask
{
    public Guid Guid { get; init; }
    public LearningTaskType TaskType { get; init; }
    public object Payload { get; init; } = null!;
}
