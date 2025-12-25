using VocabuAI.Infrastructure.Database;
using VocabuAI.Infrastructure.Database.Entities;

namespace VocabuAI.Infrastructure.Repositories;

public sealed class FlashCardRepository : Repository<FlashCardDb>, IFlashCardRepository
{
    public FlashCardRepository(AppDbContext dbContext) : base(dbContext)
    {
    }
}
