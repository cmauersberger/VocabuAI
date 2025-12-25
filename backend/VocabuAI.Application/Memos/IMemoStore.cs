using VocabuAI.Domain;

namespace VocabuAI.Application.Memos;

public interface IMemoStore
{
    IReadOnlyCollection<Memo> List();
    Memo? Get(Guid id);
    Memo Create(CreateMemoRequest request);
    Memo? Update(Guid id, UpdateMemoRequest request);
    bool Delete(Guid id);
}
