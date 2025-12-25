namespace VocabuAI.Application.Memos;

public sealed record UpdateMemoRequest(
    string Title,
    string Content
);
