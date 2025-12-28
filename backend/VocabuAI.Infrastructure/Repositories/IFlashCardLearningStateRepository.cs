using VocabuAI.Infrastructure.Database.Entities;

namespace VocabuAI.Infrastructure.Repositories;

public interface IFlashCardLearningStateRepository : IRepository<FlashCardLearningStateDb>
{
    FlashCardLearningStateDb? GetByFlashCardId(int flashCardId);
}
