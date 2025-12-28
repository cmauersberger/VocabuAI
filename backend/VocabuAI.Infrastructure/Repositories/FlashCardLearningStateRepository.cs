using VocabuAI.Infrastructure.Database;
using VocabuAI.Infrastructure.Database.Entities;

namespace VocabuAI.Infrastructure.Repositories;

public sealed class FlashCardLearningStateRepository : Repository<FlashCardLearningStateDb>, IFlashCardLearningStateRepository
{
    public FlashCardLearningStateRepository(AppDbContext dbContext) : base(dbContext)
    {
    }

    public FlashCardLearningStateDb? GetByFlashCardId(int flashCardId)
        => DbSet.FirstOrDefault(state => state.FlashCardId == flashCardId);
}
