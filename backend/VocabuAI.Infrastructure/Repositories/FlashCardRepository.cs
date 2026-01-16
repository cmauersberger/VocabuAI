using Microsoft.EntityFrameworkCore;
using VocabuAI.Application.Learning;
using VocabuAI.Domain.Learning;
using VocabuAI.Infrastructure.Database;
using VocabuAI.Infrastructure.Database.Entities;

namespace VocabuAI.Infrastructure.Repositories;

public sealed class FlashCardRepository : Repository<FlashCardDb>, IFlashCardRepository, IFlashCardVocabularyRepository
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

    public IReadOnlyCollection<string> GetForeignLanguageTermsByUserIdAndLanguageCode(
        int userId,
        string languageCode)
        => DbContext.FlashCards
            .AsNoTracking()
            .Where(card => card.UserId == userId && card.ForeignLanguageCode == languageCode)
            .Select(card => card.ForeignLanguage)
            .ToArray();

    public IReadOnlyCollection<FlashCardDb> GetAllWithLearningStateByUserId(int userId)
        => DbContext.FlashCards
            .AsNoTracking()
            .Include(card => card.LearningState)
            .Where(card => card.UserId == userId)
            .OrderByDescending(card => card.DateTimeCreated)
            .ToArray();

    public FlashCardDb? GetByIdAndUserId(int id, int userId)
        => DbContext.FlashCards.FirstOrDefault(card => card.Id == id && card.UserId == userId);

    public FlashCardDb? GetByIdWithLearningStateAndUserId(int id, int userId)
        => DbContext.FlashCards
            .Include(card => card.LearningState)
            .FirstOrDefault(card => card.Id == id && card.UserId == userId);

    public Dictionary<int, int> GetCountPerBoxByUserId(int userId)
    {
        var counts = (from card in DbContext.FlashCards.AsNoTracking()
                join state in DbContext.FlashCardLearningStates.AsNoTracking()
                    on card.Id equals state.FlashCardId into states
                from state in states.DefaultIfEmpty()
                where card.UserId == userId
                select new { card.Id, card.UserId, Box = state == null ? 1 : state.Box })
            .GroupBy(entry => entry.Box)
            .Select(group => new { Box = group.Key, Count = group.Count() })
            .ToDictionary(item => item.Box, item => item.Count);
        for (var box = 1; box <= LearningConstants.MAX_BOX; box++)
        {
            counts.TryAdd(box, 0);
        }

        return counts;
    }

    public (int CorrectCountTotal, int WrongCountTotal, DateTimeOffset? LastAnsweredAt)
        GetLearningStatisticsByUserId(int userId)
    {
        var totals = (from card in DbContext.FlashCards.AsNoTracking()
                join state in DbContext.FlashCardLearningStates.AsNoTracking()
                    on card.Id equals state.FlashCardId into states
                from state in states.DefaultIfEmpty()
                where card.UserId == userId
                select new
                {
                    Correct = state == null ? 0 : state.CorrectCountTotal,
                    Wrong = state == null ? 0 : state.WrongCountTotal,
                    LastAnsweredAt = state == null ? null : state.LastAnsweredAt
                })
            .GroupBy(_ => 1)
            .Select(group => new
            {
                Correct = group.Sum(entry => entry.Correct),
                Wrong = group.Sum(entry => entry.Wrong),
                LastAnsweredAt = group.Max(entry => entry.LastAnsweredAt)
            })
            .FirstOrDefault();

        return totals is null
            ? (0, 0, null)
            : (totals.Correct, totals.Wrong, totals.LastAnsweredAt);
    }
}
