using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using VocabuAI.Application.Pronunciation;

namespace VocabuAI.Infrastructure.Pronunciation;

public sealed class WikimediaPronunciationLookupService : IPronunciationLookupService
{
    private const string SourceName = "wikimedia-commons";
    private static readonly Regex ArabicSectionRegex = new(
        @"^==\s*Arabic\s*==\s*(?<content>.*?)(?=^==[^=]|\z)",
        RegexOptions.Multiline | RegexOptions.Singleline | RegexOptions.Compiled);
    private static readonly Regex ArabicAudioTemplateRegex = new(
        @"\{\{audio\|ar\|(?<file>[^}|]+)",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);
    private static readonly Regex ArabicAudioInlineRegex = new(
        @"<audio:(?<file>[^>]+)>",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);
    private static readonly Regex HtmlTagRegex = new(
        "<.*?>",
        RegexOptions.Singleline | RegexOptions.Compiled);
    private readonly HttpClient _client;

    public WikimediaPronunciationLookupService(HttpClient client)
    {
        _client = client;
    }

    public async Task<PronunciationLookupResult> LookupAsync(
        string term,
        string languageCode,
        CancellationToken cancellationToken)
    {
        var normalizedTerm = term.Trim();
        var normalizedLanguageCode = languageCode.Trim().ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(normalizedTerm))
        {
            return Unavailable(normalizedTerm, normalizedLanguageCode, "Term is required.");
        }

        if (!string.Equals(normalizedLanguageCode, "ar", StringComparison.Ordinal))
        {
            return Unavailable(normalizedTerm, normalizedLanguageCode, "Only Arabic pronunciation lookup is supported right now.");
        }

        try
        {
            var pageContent = await GetWiktionaryPageContentAsync(normalizedTerm, cancellationToken);
            if (string.IsNullOrWhiteSpace(pageContent))
            {
                return Unavailable(normalizedTerm, normalizedLanguageCode, "No Wiktionary entry with audio was found.");
            }

            if (!TryExtractArabicSection(pageContent, out var arabicSection))
            {
                return Unavailable(normalizedTerm, normalizedLanguageCode, "No Arabic pronunciation section was found.");
            }

            if (!TryExtractAudioFileTitle(arabicSection, out var fileTitle))
            {
                return Unavailable(normalizedTerm, normalizedLanguageCode, "No human-recorded audio file was found for this term.");
            }

            var audioFile = await GetCommonsAudioFileAsync(fileTitle, cancellationToken);
            if (audioFile?.ImageInfo is null)
            {
                return Unavailable(normalizedTerm, normalizedLanguageCode, "Audio metadata could not be loaded from Wikimedia Commons.");
            }

            var metadata = audioFile.ImageInfo.ExtMetadata;
            return new PronunciationLookupResult(
                normalizedTerm,
                normalizedLanguageCode,
                true,
                audioFile.ImageInfo.Url,
                audioFile.ImageInfo.DescriptionUrl,
                CleanMetadataValue(metadata?.LicenseShortName?.Value),
                CleanMetadataValue(metadata?.Artist?.Value),
                CleanMetadataValue(metadata?.Credit?.Value),
                SourceName,
                null);
        }
        catch (HttpRequestException)
        {
            return Unavailable(normalizedTerm, normalizedLanguageCode, "Pronunciation lookup is temporarily unavailable.");
        }
    }

    private async Task<string?> GetWiktionaryPageContentAsync(string term, CancellationToken cancellationToken)
    {
        var requestUri =
            $"https://en.wiktionary.org/w/api.php?action=query&prop=revisions&titles={Uri.EscapeDataString(term)}&rvslots=main&rvprop=content&format=json&formatversion=2";

        var payload = await _client.GetFromJsonAsync<WiktionaryQueryResponse>(requestUri, cancellationToken);
        return payload?.Query?.Pages?.FirstOrDefault()?.Revisions?.FirstOrDefault()?.Slots?.Main?.Content;
    }

    private async Task<CommonsFilePage?> GetCommonsAudioFileAsync(string fileTitle, CancellationToken cancellationToken)
    {
        var requestUri =
            $"https://commons.wikimedia.org/w/api.php?action=query&titles={Uri.EscapeDataString($"File:{fileTitle}")}&prop=imageinfo&iiprop=url|extmetadata&format=json&formatversion=2";

        var payload = await _client.GetFromJsonAsync<CommonsQueryResponse>(requestUri, cancellationToken);
        return payload?.Query?.Pages?.FirstOrDefault();
    }

    private static bool TryExtractArabicSection(string pageContent, out string sectionContent)
    {
        var match = ArabicSectionRegex.Match(pageContent);
        if (!match.Success)
        {
            sectionContent = "";
            return false;
        }

        sectionContent = match.Groups["content"].Value;
        return true;
    }

    private static bool TryExtractAudioFileTitle(string arabicSection, out string fileTitle)
    {
        var templateMatch = ArabicAudioTemplateRegex.Match(arabicSection);
        if (templateMatch.Success)
        {
            fileTitle = templateMatch.Groups["file"].Value.Trim();
            return !string.IsNullOrWhiteSpace(fileTitle);
        }

        var inlineMatch = ArabicAudioInlineRegex.Match(arabicSection);
        if (inlineMatch.Success)
        {
            fileTitle = inlineMatch.Groups["file"].Value.Trim();
            return !string.IsNullOrWhiteSpace(fileTitle);
        }

        fileTitle = "";
        return false;
    }

    private static string? CleanMetadataValue(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        var withoutTags = HtmlTagRegex.Replace(value, string.Empty);
        var decoded = WebUtility.HtmlDecode(withoutTags).Trim();
        return string.IsNullOrWhiteSpace(decoded) ? null : decoded;
    }

    private static PronunciationLookupResult Unavailable(string term, string languageCode, string message)
        => new(
            term,
            languageCode,
            false,
            null,
            null,
            null,
            null,
            null,
            SourceName,
            message);

    private sealed class WiktionaryQueryResponse
    {
        public WiktionaryQuery? Query { get; init; }
    }

    private sealed class WiktionaryQuery
    {
        public IReadOnlyList<WiktionaryPage>? Pages { get; init; }
    }

    private sealed class WiktionaryPage
    {
        public IReadOnlyList<WiktionaryRevision>? Revisions { get; init; }
    }

    private sealed class WiktionaryRevision
    {
        public WiktionarySlots? Slots { get; init; }
    }

    private sealed class WiktionarySlots
    {
        public WiktionaryMainSlot? Main { get; init; }
    }

    private sealed class WiktionaryMainSlot
    {
        public string? Content { get; init; }
    }

    private sealed class CommonsQueryResponse
    {
        public CommonsQuery? Query { get; init; }
    }

    private sealed class CommonsQuery
    {
        public IReadOnlyList<CommonsFilePage>? Pages { get; init; }
    }

    private sealed class CommonsFilePage
    {
        [JsonPropertyName("imageinfo")]
        public IReadOnlyList<CommonsImageInfo>? ImageInfos { get; init; }

        public CommonsImageInfo? ImageInfo => ImageInfos?.FirstOrDefault();
    }

    private sealed class CommonsImageInfo
    {
        public string? Url { get; init; }
        public string? DescriptionUrl { get; init; }
        public CommonsExtMetadata? ExtMetadata { get; init; }
    }

    private sealed class CommonsExtMetadata
    {
        public CommonsMetadataValue? Artist { get; init; }
        public CommonsMetadataValue? Credit { get; init; }
        public CommonsMetadataValue? LicenseShortName { get; init; }
    }

    private sealed class CommonsMetadataValue
    {
        public string? Value { get; init; }
    }
}
