namespace VocabuAI.Api.Dtos;

// Keep in sync with frontend/src/domain/dtos/UserSettingsDto.ts

public sealed record UserSettingsDto(
    string DefaultForeignFlashCardLanguage,
    string DefaultLocalFlashCardLanguage
);
