using VocabuAI.Infrastructure.Database.Entities;

namespace VocabuAI.Infrastructure.Repositories;

public interface IFlashCardRepository : IRepository<FlashCardDb>
{
    IReadOnlyCollection<FlashCardDb> GetAllByUserId(int userId);
    FlashCardDb? GetByIdAndUserId(int id, int userId);
    Dictionary<int, int> GetCountPerBoxByUserId(int userId);
}
