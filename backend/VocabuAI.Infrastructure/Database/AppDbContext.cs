using System.Linq;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using VocabuAI.Domain.Learning;
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
    public DbSet<FlashCardLearningStateDb> FlashCardLearningStates => Set<FlashCardLearningStateDb>();

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
            entity.Property(e => e.UserName).IsRequired();
            entity.Property(e => e.HashedPassword).IsRequired();
            entity.Property(e => e.DefaultForeignFlashCardLanguage)
                .IsRequired()
                .HasDefaultValue(UserDb.DefaultForeignFlashCardLanguageDefault);
            entity.Property(e => e.DefaultLocalFlashCardLanguage)
                .IsRequired()
                .HasDefaultValue(UserDb.DefaultLocalFlashCardLanguageDefault);
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
            entity.Property(e => e.ForeignLanguageCode).IsRequired();
            entity.Property(e => e.LocalLanguageCode).IsRequired();
            entity.Property(e => e.Synonyms);
            entity.Property(e => e.Annotation);
            entity.Property(e => e.DateTimeCreated).IsRequired();
            entity.Property(e => e.DateTimeUpdated).IsRequired();
            entity.HasIndex(e => e.UserId);
        });

        var jsonOptions = new JsonSerializerOptions(JsonSerializerDefaults.Web);
        var taskTypeCountsConverter = new ValueConverter<Dictionary<LearningTaskType, int>, string>(
            value => JsonSerializer.Serialize(value, jsonOptions),
            value => JsonSerializer.Deserialize<Dictionary<LearningTaskType, int>>(value, jsonOptions) ?? new Dictionary<LearningTaskType, int>());
        var taskTypeCountsComparer = new ValueComparer<Dictionary<LearningTaskType, int>>(
            (left, right) => DictionaryEquals(left, right),
            value => DictionaryHash(value),
            value => CloneDictionary(value));

        modelBuilder.Entity<FlashCardLearningStateDb>(entity =>
        {
            entity.ToTable("FlashCardLearningState", table =>
                table.HasCheckConstraint("CK_FlashCardLearningState_Box_Range", "\"Box\" >= 1 AND \"Box\" <= 5"));
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.FlashCardId).IsRequired();
            entity.Property(e => e.Box).IsRequired();
            entity.Property(e => e.ProgressPointsInCurrentBox).IsRequired();
            entity.Property(e => e.CorrectCountsByQuestionTypeInCurrentBox)
                .IsRequired()
                .HasColumnType("jsonb")
                .HasConversion(taskTypeCountsConverter)
                .Metadata.SetValueComparer(taskTypeCountsComparer);
            entity.Property(e => e.CorrectCountTotal).IsRequired();
            entity.Property(e => e.WrongCountTotal).IsRequired();
            entity.Property(e => e.CorrectStreak).IsRequired();
            entity.Property(e => e.LastAnsweredAt);
            entity.Property(e => e.DateTimeCreated).IsRequired();
            entity.Property(e => e.DateTimeUpdated).IsRequired();
            entity.HasOne(e => e.FlashCard)
                .WithOne(e => e.LearningState)
                .HasForeignKey<FlashCardLearningStateDb>(e => e.FlashCardId)
                .IsRequired()
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.FlashCardId).IsUnique();
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

    private static bool DictionaryEquals(
        Dictionary<LearningTaskType, int>? left,
        Dictionary<LearningTaskType, int>? right)
    {
        if (ReferenceEquals(left, right))
        {
            return true;
        }

        if (left is null || right is null || left.Count != right.Count)
        {
            return false;
        }

        foreach (var item in left)
        {
            if (!right.TryGetValue(item.Key, out var rightValue) || rightValue != item.Value)
            {
                return false;
            }
        }

        return true;
    }

    private static int DictionaryHash(Dictionary<LearningTaskType, int>? value)
        => value is null ? 0 : value.Aggregate(0, (hash, item) => HashCode.Combine(hash, item.Key, item.Value));

    private static Dictionary<LearningTaskType, int> CloneDictionary(Dictionary<LearningTaskType, int>? value)
        => value is null ? new Dictionary<LearningTaskType, int>() : value.ToDictionary(item => item.Key, item => item.Value);
}
