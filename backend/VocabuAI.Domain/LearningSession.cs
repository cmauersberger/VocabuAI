namespace VocabuAI.Domain.Learning;

public sealed class LearningSession
{
    public Guid Guid { get; init; }
    public int UserId { get; init; }
    public DateTimeOffset CreatedAt { get; init; }
    public IReadOnlyList<LearningTask> Tasks { get; init; } = Array.Empty<LearningTask>();
}
