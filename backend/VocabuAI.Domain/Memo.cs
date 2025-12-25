namespace VocabuAI.Domain;

public sealed record Memo(
    Guid Id,
    string Title,
    string Content,
    DateTimeOffset CreatedAt
);
