namespace VocabuAI.Infrastructure.Database.Entities;

public sealed class FlashCardDb : BaseEntityDb
{
    public int UserId { get; set; }
    public string ForeignLanguage { get; set; } = null!;
    public string LocalLanguage { get; set; } = null!;
    public string ForeignLanguageCode { get; set; } = null!;
    public string LocalLanguageCode { get; set; } = null!;
    public string? Synonyms { get; set; }
    public string? Annotation { get; set; }

    public UserDb User { get; set; } = null!;
    public FlashCardLearningStateDb? LearningState { get; set; }
}
