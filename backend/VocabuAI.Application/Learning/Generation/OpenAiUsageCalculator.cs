using System.Globalization;

namespace VocabuAI.Application.Learning.Generation;

public static class OpenAiUsageCalculator
{
    public static string GetMonthKeyUtc(DateTimeOffset utcNow)
        => utcNow.ToString("yyyy-MM", CultureInfo.InvariantCulture);

    public static double? GetUsagePercent(int usedTokens, int monthlyLimit)
        => monthlyLimit > 0 ? usedTokens / (double)monthlyLimit : null;

}
