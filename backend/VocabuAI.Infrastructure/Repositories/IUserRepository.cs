using VocabuAI.Infrastructure.Database.Entities;

namespace VocabuAI.Infrastructure.Repositories;

public interface IUserRepository : IRepository<UserDb>
{
    UserDb? GetByEmail(string email);
}
