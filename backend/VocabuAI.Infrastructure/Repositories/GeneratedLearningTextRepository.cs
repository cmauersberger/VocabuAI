using Microsoft.EntityFrameworkCore;
using VocabuAI.Infrastructure.Database;
using VocabuAI.Infrastructure.Database.Entities;

namespace VocabuAI.Infrastructure.Repositories;

public sealed class GeneratedLearningTextRepository : Repository<GeneratedLearningTextDb>, IGeneratedLearningTextRepository
{
    public GeneratedLearningTextRepository(AppDbContext dbContext) : base(dbContext)
    {
    }

    public IReadOnlyCollection<GeneratedLearningTextDb> GetAllByUserId(int userId)
        => DbContext.GeneratedLearningTexts
            .AsNoTracking()
            .Where(item => item.UserId == userId)
            .OrderByDescending(item => item.DateTimeCreated)
            .ToArray();

    public GeneratedLearningTextDb? GetByIdAndUserId(int id, int userId)
        => DbContext.GeneratedLearningTexts
            .FirstOrDefault(item => item.Id == id && item.UserId == userId);
}
