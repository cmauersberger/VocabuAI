namespace VocabuAI.Api.Domain;

public sealed record CreateMemoRequest(
    string Title,
    string Content
);

