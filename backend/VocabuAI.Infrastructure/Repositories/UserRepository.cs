using VocabuAI.Infrastructure.Database;
using VocabuAI.Infrastructure.Database.Entities;

namespace VocabuAI.Infrastructure.Repositories;

public sealed class UserRepository : Repository<UserDb>, IUserRepository
{
    public UserRepository(AppDbContext dbContext) : base(dbContext)
    {
    }
}
