using System.Data;
using Microsoft.EntityFrameworkCore;
using VocabuAI.Infrastructure.Database;
using VocabuAI.Infrastructure.Database.Entities;

namespace VocabuAI.Infrastructure.Repositories;

public sealed class UserRepository : Repository<UserDb>, IUserRepository
{
    public UserRepository(AppDbContext dbContext) : base(dbContext)
    {
    }

    public UserDb? GetByEmail(string email)
        => DbContext.Users.FirstOrDefault(user => user.Email == email);

    public int GetUserCount()
        => DbContext.Users.Count();

    public bool TryAddUserWithLimit(UserDb user, int maxUsers)
    {
        using var transaction = DbContext.Database.BeginTransaction(IsolationLevel.Serializable);
        var count = DbContext.Users.Count();
        if (count >= maxUsers)
        {
            transaction.Rollback();
            return false;
        }

        DbContext.Users.Add(user);
        DbContext.SaveChanges();
        transaction.Commit();
        return true;
    }
}
