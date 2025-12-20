namespace VocabuAI.Api.Domain;

public sealed record Memo(
    Guid Id,
    string Title,
    string Content,
    DateTimeOffset CreatedAt
);

