namespace VocabuAI.Application.Learning.Generation.Validation;

/// <summary>
/// Backend-only validation result for generated text.
/// </summary>
public sealed record TextGenerationValidationResult
{
    /// <summary>
    /// Whether validation succeeded.
    /// </summary>
    public bool IsValid { get; init; }

    /// <summary>
    /// Optional error message when validation fails.
    /// </summary>
    public string? ErrorMessage { get; init; }

    /// <summary>
    /// Creates a successful validation result.
    /// </summary>
    public static TextGenerationValidationResult Success() => new() { IsValid = true };

    /// <summary>
    /// Creates a failed validation result.
    /// </summary>
    public static TextGenerationValidationResult Failure(string errorMessage) => new()
    {
        IsValid = false,
        ErrorMessage = errorMessage
    };
}
