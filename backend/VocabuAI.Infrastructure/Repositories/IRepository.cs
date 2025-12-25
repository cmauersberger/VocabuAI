using VocabuAI.Infrastructure.Database.Entities;

namespace VocabuAI.Infrastructure.Repositories;

public interface IRepository<T> where T : BaseEntityDb
{
    T? GetById(int id);
    void Add(T entity);
    void Update(T entity);
    void Remove(T entity);
    int SaveChanges();
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
