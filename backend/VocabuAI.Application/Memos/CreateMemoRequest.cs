namespace VocabuAI.Application.Memos;

public sealed record CreateMemoRequest(
    string Title,
    string Content
);
