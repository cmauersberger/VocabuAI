namespace VocabuAI.Api.Models.FlashCards;

public sealed record FlashCardBackupItemModel(
    int ExportId,
    FlashCardExportModel Flashcard,
    FlashCardLearningStateExportModel? LearningState
);
