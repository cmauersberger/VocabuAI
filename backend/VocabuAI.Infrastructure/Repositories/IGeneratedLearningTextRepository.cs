using VocabuAI.Infrastructure.Database.Entities;

namespace VocabuAI.Infrastructure.Repositories;

public interface IGeneratedLearningTextRepository : IRepository<GeneratedLearningTextDb>
{
    IReadOnlyCollection<GeneratedLearningTextDb> GetAllByUserId(int userId);
    GeneratedLearningTextDb? GetByIdAndUserId(int id, int userId);
}
