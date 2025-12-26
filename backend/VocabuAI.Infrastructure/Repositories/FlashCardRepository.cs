using Microsoft.EntityFrameworkCore;
using VocabuAI.Infrastructure.Database;
using VocabuAI.Infrastructure.Database.Entities;

namespace VocabuAI.Infrastructure.Repositories;

public sealed class FlashCardRepository : Repository<FlashCardDb>, IFlashCardRepository
{
    public FlashCardRepository(AppDbContext dbContext) : base(dbContext)
    {
    }

    public IReadOnlyCollection<FlashCardDb> GetAllByUserId(int userId)
        => DbContext.FlashCards
            .AsNoTracking()
            .Where(card => card.UserId == userId)
            .OrderByDescending(card => card.DateTimeCreated)
            .ToArray();

    public FlashCardDb? GetByIdAndUserId(int id, int userId)
        => DbContext.FlashCards.FirstOrDefault(card => card.Id == id && card.UserId == userId);
}
