using Microsoft.EntityFrameworkCore;
using VocabuAI.Infrastructure.Database.Entities;

namespace VocabuAI.Infrastructure.Database;

public sealed class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<UserDb> Users => Set<UserDb>();
    public DbSet<FlashCardDb> FlashCards => Set<FlashCardDb>();

    public override int SaveChanges()
    {
        UpdateTimestamps();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        UpdateTimestamps();
        return base.SaveChangesAsync(cancellationToken);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserDb>(entity =>
        {
            entity.ToTable("Users");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.Email).IsRequired();
            entity.Property(e => e.HashedPassword).IsRequired();
            entity.Property(e => e.DateTimeCreated).IsRequired();
            entity.Property(e => e.DateTimeUpdated).IsRequired();
            entity.HasMany(e => e.FlashCards)
                .WithOne(e => e.User)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<FlashCardDb>(entity =>
        {
            entity.ToTable("FlashCards");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.UserId).IsRequired();
            entity.Property(e => e.ForeignLanguage).IsRequired();
            entity.Property(e => e.LocalLanguage).IsRequired();
            entity.Property(e => e.Synonyms);
            entity.Property(e => e.Annotation);
            entity.Property(e => e.DateTimeCreated).IsRequired();
            entity.Property(e => e.DateTimeUpdated).IsRequired();
            entity.HasIndex(e => e.UserId);
        });
    }

    private void UpdateTimestamps()
    {
        var now = DateTimeOffset.UtcNow;

        foreach (var entry in ChangeTracker.Entries<BaseEntityDb>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.DateTimeCreated = now;
                entry.Entity.DateTimeUpdated = now;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.DateTimeUpdated = now;
            }
        }
    }
}
