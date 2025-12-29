namespace VocabuAI.Application.Learning;

public sealed record LearningFlashCard(
    int Id,
    string ForeignLanguage,
    string LocalLanguage,
    string? Synonyms,
    int Box,
    int CorrectStreak,
    DateTimeOffset? LastAnsweredAt
);
