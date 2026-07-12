using System.Globalization;
using System.Reflection;

namespace VocabuAI.Api.Infrastructure;

public sealed record AppBuildInfo(
    string ApplicationName,
    string Version,
    string? CommitSha,
    string? Branch,
    DateTimeOffset? BuildTimeUtc)
{
    public static AppBuildInfo Create(string applicationName)
    {
        var assembly = Assembly.GetExecutingAssembly();
        var version = Environment.GetEnvironmentVariable("APP_VERSION")
            ?? assembly.GetCustomAttribute<AssemblyInformationalVersionAttribute>()?.InformationalVersion
            ?? assembly.GetName().Version?.ToString()
            ?? "0.2.2";

        var commitSha = Normalize(Environment.GetEnvironmentVariable("APP_COMMIT_SHA"));
        var branch = Normalize(Environment.GetEnvironmentVariable("APP_BRANCH"));
        var buildTimeRaw = Normalize(Environment.GetEnvironmentVariable("APP_BUILD_TIME_UTC"));

        DateTimeOffset? buildTimeUtc = null;
        if (!string.IsNullOrWhiteSpace(buildTimeRaw) &&
            DateTimeOffset.TryParse(
                buildTimeRaw,
                CultureInfo.InvariantCulture,
                DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal,
                out var parsed))
        {
            buildTimeUtc = parsed;
        }

        return new AppBuildInfo(
            applicationName,
            version,
            commitSha,
            branch,
            buildTimeUtc);
    }

    private static string? Normalize(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
