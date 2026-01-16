namespace VocabuAI.Application.Learning.Generation.Contracts;

/// <summary>
/// Backend-only difficulty levels for AI text generation.
/// </summary>
public enum DifficultyLevel
{
    /// <summary>
    /// Unspecified difficulty.
    /// </summary>
    Unspecified = 0,

    /// <summary>
    /// Beginner difficulty.
    /// </summary>
    Beginner = 1,

    /// <summary>
    /// Intermediate difficulty.
    /// </summary>
    Intermediate = 2,

    /// <summary>
    /// Advanced difficulty.
    /// </summary>
    Advanced = 3
}
