using System.Collections.Concurrent;
using VocabuAI.Api.Domain;

namespace VocabuAI.Api.Infrastructure;

public sealed class InMemoryMemoStore
{
    private readonly ConcurrentDictionary<Guid, Memo> _memos = new();

    public IReadOnlyCollection<Memo> List()
        => _memos.Values.OrderByDescending(m => m.CreatedAt).ToArray();

    public Memo? Get(Guid id)
        => _memos.TryGetValue(id, out var memo) ? memo : null;

    public Memo Create(CreateMemoRequest request)
    {
        var memo = new Memo(
            Id: Guid.NewGuid(),
            Title: request.Title.Trim(),
            Content: request.Content.Trim(),
            CreatedAt: DateTimeOffset.UtcNow
        );

        _memos[memo.Id] = memo;
        return memo;
    }

    public Memo? Update(Guid id, UpdateMemoRequest request)
    {
        if (!_memos.TryGetValue(id, out var existing)) return null;

        var updated = existing with
        {
            Title = request.Title.Trim(),
            Content = request.Content.Trim()
        };

        _memos[id] = updated;
        return updated;
    }

    public bool Delete(Guid id)
        => _memos.TryRemove(id, out _);
}
