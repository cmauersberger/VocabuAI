using System.Globalization;
using System.Text.Json;
using System.Linq;
using VocabuAI.Api.Dtos.FlashCards;
using VocabuAI.Api.Models.FlashCards;
using VocabuAI.Domain.Learning;
using VocabuAI.Infrastructure.Database.Entities;
using VocabuAI.Infrastructure.Repositories;

namespace VocabuAI.Api.Infrastructure;

public sealed class FlashCardImportExportService
{
    private static readonly JsonSerializerOptions ExportJsonOptions = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private static readonly JsonSerializerOptions ImportJsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly IFlashCardRepository _flashCardRepository;
    private readonly IFlashCardLearningStateRepository _learningStateRepository;

    public FlashCardImportExportService(
        IFlashCardRepository flashCardRepository,
        IFlashCardLearningStateRepository learningStateRepository)
    {
        _flashCardRepository = flashCardRepository;
        _learningStateRepository = learningStateRepository;
    }

    public string ExportAsJson(int userId)
    {
        var flashCards = _flashCardRepository.GetAllWithLearningStateByUserId(userId).ToArray();
        var items = new List<FlashCardBackupItemModel>(flashCards.Length);

        for (var index = 0; index < flashCards.Length; index++)
        {
            var flashCard = flashCards[index];
            items.Add(new FlashCardBackupItemModel(
                index + 1,
                ToExportFlashCard(flashCard),
                flashCard.LearningState is null ? null : ToExportLearningState(flashCard.LearningState)
            ));
        }

        var backup = new FlashCardBackupModel(items);
        return JsonSerializer.Serialize(backup, ExportJsonOptions);
    }

    public async Task<FlashCardImportResultDto> ImportAsync(Stream stream, int userId, CancellationToken cancellationToken)
    {
        FlashCardBackupModel? backup;
        try
        {
            backup = await JsonSerializer.DeserializeAsync<FlashCardBackupModel>(stream, ImportJsonOptions, cancellationToken);
        }
        catch (JsonException)
        {
            return new FlashCardImportResultDto(0, 0, new List<string> { "Invalid backup file format." });
        }

        if (backup?.Flashcards is null || backup.Flashcards.Count == 0)
        {
            return new FlashCardImportResultDto(0, 0, new List<string> { "No flashcards found in the backup." });
        }

        var importedFlashcards = 0;
        var importedLearningStates = 0;
        var errors = new List<string>();

        for (var index = 0; index < backup.Flashcards.Count; index++)
        {
            var item = backup.Flashcards[index];
            var exportId = item.ExportId > 0 ? item.ExportId : index + 1;

            if (item.Flashcard is null)
            {
                errors.Add($"Flashcard {exportId}: missing flashcard data.");
                continue;
            }

            var flashCardValidationError = ValidateFlashCard(item.Flashcard);
            if (flashCardValidationError is not null)
            {
                errors.Add($"Flashcard {exportId}: {flashCardValidationError}");
                continue;
            }

            if (!TryNormalizeLanguageCode(item.Flashcard.ForeignLanguageCode, out var foreignCode, out var codeError))
            {
                errors.Add($"Flashcard {exportId}: {codeError}");
                continue;
            }

            if (!TryNormalizeLanguageCode(item.Flashcard.LocalLanguageCode, out var localCode, out codeError))
            {
                errors.Add($"Flashcard {exportId}: {codeError}");
                continue;
            }

            var flashCardEntity = ToFlashCardDb(item.Flashcard, userId, foreignCode, localCode);

            try
            {
                _flashCardRepository.Add(flashCardEntity);
                await _flashCardRepository.SaveChangesAsync(cancellationToken);
                importedFlashcards++;
            }
            catch (Exception)
            {
                errors.Add($"Flashcard {exportId}: failed to save.");
                continue;
            }

            if (item.LearningState is null)
            {
                continue;
            }

            var learningStateValidationError = ValidateLearningState(item.LearningState);
            if (learningStateValidationError is not null)
            {
                errors.Add($"Flashcard {exportId}: {learningStateValidationError}");
                continue;
            }

            var learningStateEntity = ToLearningStateDb(item.LearningState, flashCardEntity.Id);

            try
            {
                _learningStateRepository.Add(learningStateEntity);
                await _learningStateRepository.SaveChangesAsync(cancellationToken);
                importedLearningStates++;
            }
            catch (Exception)
            {
                errors.Add($"Flashcard {exportId}: learning state failed to save.");
            }
        }

        return new FlashCardImportResultDto(importedFlashcards, importedLearningStates, errors);
    }

    private static FlashCardExportModel ToExportFlashCard(FlashCardDb flashCard)
        => new(
            flashCard.ForeignLanguage,
            flashCard.LocalLanguage,
            flashCard.ForeignLanguageCode,
            flashCard.LocalLanguageCode,
            flashCard.Synonyms,
            flashCard.Annotation
        );

    private static FlashCardLearningStateExportModel ToExportLearningState(FlashCardLearningStateDb state)
        => new(
            state.Box,
            state.ProgressPointsInCurrentBox,
            state.CorrectCountsByQuestionTypeInCurrentBox,
            state.CorrectCountTotal,
            state.WrongCountTotal,
            state.CorrectStreak,
            state.LastAnsweredAt,
            state.DateTimeCreated
        );

    private static FlashCardDb ToFlashCardDb(
        FlashCardExportModel flashCard,
        int userId,
        string foreignCode,
        string localCode)
        => new()
        {
            UserId = userId,
            ForeignLanguage = flashCard.ForeignLanguage.Trim(),
            LocalLanguage = flashCard.LocalLanguage.Trim(),
            ForeignLanguageCode = foreignCode,
            LocalLanguageCode = localCode,
            Synonyms = string.IsNullOrWhiteSpace(flashCard.Synonyms) ? null : flashCard.Synonyms.Trim(),
            Annotation = string.IsNullOrWhiteSpace(flashCard.Annotation) ? null : flashCard.Annotation.Trim()
        };

    private static FlashCardLearningStateDb ToLearningStateDb(FlashCardLearningStateExportModel state, int flashCardId)
        => new()
        {
            FlashCardId = flashCardId,
            Box = state.Box,
            ProgressPointsInCurrentBox = state.ProgressPointsInCurrentBox,
            CorrectCountsByQuestionTypeInCurrentBox = state.CorrectCountsByQuestionTypeInCurrentBox
                ?? new Dictionary<LearningTaskType, int>(),
            CorrectCountTotal = state.CorrectCountTotal,
            WrongCountTotal = state.WrongCountTotal,
            CorrectStreak = state.CorrectStreak,
            LastAnsweredAt = state.LastAnsweredAt,
            DateTimeCreated = state.DateTimeCreated,
            DateTimeUpdated = state.DateTimeCreated
        };

    private static string? ValidateFlashCard(FlashCardExportModel flashCard)
    {
        if (string.IsNullOrWhiteSpace(flashCard.ForeignLanguage))
            return "ForeignLanguage is required.";
        if (string.IsNullOrWhiteSpace(flashCard.LocalLanguage))
            return "LocalLanguage is required.";
        if (string.IsNullOrWhiteSpace(flashCard.ForeignLanguageCode))
            return "ForeignLanguageCode is required.";
        if (string.IsNullOrWhiteSpace(flashCard.LocalLanguageCode))
            return "LocalLanguageCode is required.";
        return null;
    }

    private static string? ValidateLearningState(FlashCardLearningStateExportModel state)
    {
        if (state.Box < 1 || state.Box > 5)
            return "learning state box must be between 1 and 5.";
        if (state.ProgressPointsInCurrentBox < 0)
            return "learning state progress points must be >= 0.";
        if (state.CorrectCountTotal < 0 || state.WrongCountTotal < 0 || state.CorrectStreak < 0)
            return "learning state counts must be >= 0.";
        if (state.DateTimeCreated == default)
            return "learning state DateTimeCreated is required.";
        if (state.CorrectCountsByQuestionTypeInCurrentBox is not null
            && state.CorrectCountsByQuestionTypeInCurrentBox.Values.Any(value => value < 0))
            return "learning state correct counts must be >= 0.";
        return null;
    }

    private static bool TryNormalizeLanguageCode(string? value, out string normalized, out string error)
    {
        normalized = value?.Trim() ?? "";
        if (string.IsNullOrWhiteSpace(normalized))
        {
            error = "Language code is required.";
            return false;
        }

        try
        {
            if (IsInvariantGlobalization())
            {
                if (!IsBasicLanguageCode(normalized))
                {
                    error = "Language code is invalid.";
                    return false;
                }
            }
            else
            {
                normalized = CultureInfo.GetCultureInfo(normalized).Name;
            }
        }
        catch (CultureNotFoundException)
        {
            error = "Language code is invalid.";
            return false;
        }

        error = "";
        return true;
    }

    private static bool IsInvariantGlobalization()
        => AppContext.TryGetSwitch("System.Globalization.Invariant", out var invariant) && invariant;

    private static bool IsBasicLanguageCode(string value)
    {
        for (var i = 0; i < value.Length; i++)
        {
            var ch = value[i];
            var isAlphaNum = (ch >= 'a' && ch <= 'z')
                || (ch >= 'A' && ch <= 'Z')
                || (ch >= '0' && ch <= '9');
            if (isAlphaNum)
            {
                continue;
            }

            if (ch == '-' && i > 0 && i < value.Length - 1)
            {
                continue;
            }

            return false;
        }

        return true;
    }
}
