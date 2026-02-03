using System.Globalization;

namespace VocabuAI.Application.Learning.Generation;

public static class OpenAiUsageCalculator
{
    public static string GetMonthKey(DateTimeOffset utcNow, string? timeZone)
    {
        var zone = ResolveTimeZone(timeZone);
        var local = TimeZoneInfo.ConvertTime(utcNow, zone);
        return local.ToString("yyyy-MM", CultureInfo.InvariantCulture);
    }

    public static double? GetUsagePercent(int usedTokens, int monthlyLimit)
        => monthlyLimit > 0 ? usedTokens / (double)monthlyLimit : null;

    private static TimeZoneInfo ResolveTimeZone(string? timeZone)
    {
        if (string.IsNullOrWhiteSpace(timeZone))
        {
            return TimeZoneInfo.Utc;
        }

        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById(timeZone);
        }
        catch (TimeZoneNotFoundException)
        {
            return TimeZoneInfo.Utc;
        }
        catch (InvalidTimeZoneException)
        {
            return TimeZoneInfo.Utc;
        }
    }
}
