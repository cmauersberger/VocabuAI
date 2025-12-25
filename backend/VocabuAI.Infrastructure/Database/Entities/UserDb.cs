namespace VocabuAI.Infrastructure.Database.Entities;

public sealed class UserDb : BaseEntityDb
{
    public string Email { get; set; } = "";
    public string UserName { get; set; } = "";
    public string HashedPassword { get; set; } = "";

    public ICollection<FlashCardDb> FlashCards { get; set; } = new List<FlashCardDb>();
}
