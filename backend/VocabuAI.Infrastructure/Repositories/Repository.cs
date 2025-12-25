using Microsoft.EntityFrameworkCore;
using VocabuAI.Infrastructure.Database;
using VocabuAI.Infrastructure.Database.Entities;

namespace VocabuAI.Infrastructure.Repositories;

public class Repository<T> : IRepository<T> where T : BaseEntityDb
{
    protected readonly AppDbContext DbContext;
    protected readonly DbSet<T> DbSet;

    public Repository(AppDbContext dbContext)
    {
        DbContext = dbContext;
        DbSet = dbContext.Set<T>();
    }

    public T? GetById(int id)
        => DbSet.Find(id);

    public void Add(T entity)
        => DbSet.Add(entity);

    public void Update(T entity)
        => DbSet.Update(entity);

    public void Remove(T entity)
        => DbSet.Remove(entity);

    public int SaveChanges()
        => DbContext.SaveChanges();

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        => DbContext.SaveChangesAsync(cancellationToken);
}
