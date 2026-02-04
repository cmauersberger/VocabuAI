namespace VocabuAI.Application.Learning;

/// <summary>
/// Backend-only repository abstraction for flashcard vocabulary lookups.
/// </summary>
public interface IFlashCardVocabularyRepository
{
    /// <summary>
    /// Returns the foreign-language flashcard terms for a user in the given language code.
    /// </summary>
    IReadOnlyCollection<string> GetForeignLanguageTermsByUserIdAndLanguageCode(
        int userId,
        string languageCode);

    /// <summary>
    /// Returns flashcards with learning state for a user in the given language code.
    /// </summary>
    IReadOnlyCollection<LearningFlashCard> GetLearningFlashCardsByUserIdAndLanguageCode(
        int userId,
        string languageCode);
}
