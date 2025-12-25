namespace VocabuAI.Infrastructure.Database.Entities;

public abstract class BaseEntityDb
{
    public int Id { get; set; }
    public DateTimeOffset DateTimeCreated { get; set; }
    public DateTimeOffset DateTimeUpdated { get; set; }
}
