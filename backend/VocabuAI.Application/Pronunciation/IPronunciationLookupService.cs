namespace VocabuAI.Application.Pronunciation;

public interface IPronunciationLookupService
{
    Task<PronunciationLookupResult> LookupAsync(string term, string languageCode, CancellationToken cancellationToken);
}
