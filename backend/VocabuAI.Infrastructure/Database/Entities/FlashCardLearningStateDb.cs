using VocabuAI.Domain.Learning;

namespace VocabuAI.Infrastructure.Database.Entities;

public sealed class FlashCardLearningStateDb : BaseEntityDb
{
    public int FlashCardId { get; set; }
    public int Box { get; set; }
    public int ProgressPointsInCurrentBox { get; set; }
    public Dictionary<LearningTaskType, int> CorrectCountsByQuestionTypeInCurrentBox { get; set; } = new();
    public int CorrectCountTotal { get; set; }
    public int WrongCountTotal { get; set; }
    public int CorrectStreak { get; set; }
    public DateTimeOffset? LastAnsweredAt { get; set; }

    public FlashCardDb FlashCard { get; set; } = null!;
}
