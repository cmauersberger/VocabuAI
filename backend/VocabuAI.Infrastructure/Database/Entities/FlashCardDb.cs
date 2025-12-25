namespace VocabuAI.Infrastructure.Database.Entities;

public sealed class FlashCardDb : BaseEntityDb
{
    public int UserId { get; set; }
    public string ForeignLanguage { get; set; } = "";
    public string LocalLanguage { get; set; } = "";
    public string? Synonyms { get; set; }
    public string? Annotation { get; set; }

    public UserDb User { get; set; } = null!;
}
