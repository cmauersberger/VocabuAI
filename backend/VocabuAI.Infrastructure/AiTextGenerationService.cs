using Microsoft.EntityFrameworkCore;
using VocabuAI.Application.Learning.Generation;
using VocabuAI.Application.Learning.Generation.Contracts;
using VocabuAI.Infrastructure.Database;
using VocabuAI.Infrastructure.Llm;

namespace VocabuAI.Infrastructure;

public sealed class AiTextGenerationService : IAiTextGenerationService
{
    private readonly AppDbContext _dbContext;
    private readonly OllamaAiTextClient _ollamaClient;
    private readonly OpenAiTextClient _openAiClient;

    public AiTextGenerationService(
        AppDbContext dbContext,
        OllamaAiTextClient ollamaClient,
        OpenAiTextClient openAiClient)
    {
        _dbContext = dbContext;
        _ollamaClient = ollamaClient;
        _openAiClient = openAiClient;
    }

    public async Task<AiTextResult> GenerateForUserAsync(
        int userId,
        AiProvider? provider,
        string prompt,
        CancellationToken ct)
    {
        var user = await _dbContext.Users.SingleOrDefaultAsync(u => u.Id == userId, ct);
        if (user is null)
        {
            throw new InvalidOperationException("User not found.");
        }

        var resolvedProvider = ResolveProvider(provider, user.LastSelectedAiProvider);
        if (resolvedProvider == AiProvider.OpenAi)
        {
            return await GenerateWithOpenAiAsync(userId, prompt, ct);
        }

        var result = await _ollamaClient.GenerateAsync(new AiTextRequest(userId, AiProvider.Ollama, prompt), ct);
        if (!string.Equals(user.LastSelectedAiProvider, AiProvider.Ollama.ToApiValue(), StringComparison.Ordinal))
        {
            user.LastSelectedAiProvider = AiProvider.Ollama.ToApiValue();
            await _dbContext.SaveChangesAsync(ct);
        }

        return result;
    }

    public async Task<AiProvider> ResolveProviderForUserAsync(
        int userId,
        AiProvider? provider,
        CancellationToken ct)
    {
        var user = await _dbContext.Users.SingleOrDefaultAsync(u => u.Id == userId, ct);
        if (user is null)
        {
            throw new InvalidOperationException("User not found.");
        }

        return ResolveProvider(provider, user.LastSelectedAiProvider);
    }

    private async Task<AiTextResult> GenerateWithOpenAiAsync(
        int userId,
        string prompt,
        CancellationToken ct)
    {
        var now = DateTimeOffset.UtcNow;
        var monthKey = OpenAiUsageCalculator.GetMonthKeyUtc(now);
        var preflightUser = await _dbContext.Users.AsNoTracking().SingleOrDefaultAsync(u => u.Id == userId, ct);
        if (preflightUser is null)
        {
            throw new InvalidOperationException("User not found.");
        }

        EnsureOpenAiConfigured(preflightUser);
        var effectiveUsed = string.Equals(preflightUser.OpenAiTokensUsedMonthKey, monthKey, StringComparison.Ordinal)
            ? preflightUser.OpenAiTokensUsedThisMonth
            : 0;
        if (effectiveUsed >= preflightUser.OpenAiMonthlyTokenLimit)
        {
            throw new OpenAiBudgetExceededException("OpenAI monthly token budget exceeded.");
        }

        var result = await _openAiClient.GenerateAsync(new AiTextRequest(userId, AiProvider.OpenAi, prompt), ct);
        var totalTokens = result.TokenUsage?.TotalTokens ?? 0;

        await using var transaction = await _dbContext.Database.BeginTransactionAsync(ct);
        var user = await _dbContext.Users
            .FromSqlRaw("SELECT * FROM \"Users\" WHERE \"Id\" = {0} FOR UPDATE", userId)
            .SingleOrDefaultAsync(ct);

        if (user is null)
        {
            throw new InvalidOperationException("User not found.");
        }

        EnsureMonthKey(user, monthKey);
        EnsureOpenAiConfigured(user);

        if (totalTokens > 0 && user.OpenAiTokensUsedThisMonth + totalTokens > user.OpenAiMonthlyTokenLimit)
        {
            throw new OpenAiBudgetExceededException("OpenAI monthly token budget exceeded.");
        }

        user.OpenAiTokensUsedThisMonth += totalTokens;
        user.LastSelectedAiProvider = AiProvider.OpenAi.ToApiValue();

        await _dbContext.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);

        return result with
        {
            TokensUsedThisMonth = user.OpenAiTokensUsedThisMonth,
            MonthlyTokenLimit = user.OpenAiMonthlyTokenLimit,
            MonthKey = user.OpenAiTokensUsedMonthKey
        };
    }

    private static AiProvider ResolveProvider(AiProvider? requested, string? stored)
    {
        if (requested.HasValue)
        {
            return requested.Value;
        }

        if (AiProviderExtensions.TryParse(stored, out var parsed))
        {
            return parsed;
        }

        return AiProvider.Ollama;
    }

    private static void EnsureOpenAiConfigured(Infrastructure.Database.Entities.UserDb user)
    {
        if (string.IsNullOrWhiteSpace(user.OpenAiApiKeyEncrypted))
        {
            throw new InvalidOperationException("OpenAI API key is not configured.");
        }

        if (user.OpenAiMonthlyTokenLimit <= 0)
        {
            throw new InvalidOperationException("OpenAI monthly token limit must be greater than 0.");
        }
    }

    private static void EnsureMonthKey(Infrastructure.Database.Entities.UserDb user, string monthKey)
    {
        if (!string.Equals(user.OpenAiTokensUsedMonthKey, monthKey, StringComparison.Ordinal))
        {
            user.OpenAiTokensUsedMonthKey = monthKey;
            user.OpenAiTokensUsedThisMonth = 0;
        }
    }

}
