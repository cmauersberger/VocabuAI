namespace VocabuAI.Api.Domain;

public sealed record UpdateMemoRequest(
    string Title,
    string Content
);

