namespace VocabuAI.Infrastructure.Database.Entities;

public sealed class GeneratedLearningTextDb : BaseEntityDb
{
    public int UserId { get; set; }
    public string Prompt { get; set; } = "";
    public string Text { get; set; } = "";
    public string Provider { get; set; } = "";

    public UserDb? User { get; set; }
}
