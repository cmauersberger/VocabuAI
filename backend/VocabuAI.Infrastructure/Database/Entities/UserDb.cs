namespace VocabuAI.Infrastructure.Database.Entities;

public sealed class UserDb : BaseEntityDb
{
    // Defaults for new users and database migration seed values.
    public const string DefaultForeignFlashCardLanguageDefault = "en";
    public const string DefaultLocalFlashCardLanguageDefault = "de";

    public string Email { get; set; } = "";
    public string UserName { get; set; } = "";
    public string HashedPassword { get; set; } = "";
    public string DefaultForeignFlashCardLanguage { get; set; } = DefaultForeignFlashCardLanguageDefault;
    public string DefaultLocalFlashCardLanguage { get; set; } = DefaultLocalFlashCardLanguageDefault;
    public string? OpenAiApiKeyEncrypted { get; set; }
    public int OpenAiMonthlyTokenLimit { get; set; }
    public int OpenAiTokensUsedThisMonth { get; set; }
    public string OpenAiTokensUsedMonthKey { get; set; } = "";
    public string LastSelectedAiProvider { get; set; } = "ollama";
    public ICollection<FlashCardDb> FlashCards { get; set; } = new List<FlashCardDb>();
    public ICollection<GeneratedLearningTextDb> GeneratedLearningTexts { get; set; } = new List<GeneratedLearningTextDb>();
}
