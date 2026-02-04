namespace VocabuAI.Application.Learning.Generation.Contracts;

/// <summary>
/// Backend-only text style hints for AI text generation.
/// </summary>
public enum TextStyle
{
    /// <summary>
    /// Unspecified style.
    /// </summary>
    Unspecified = 0,

    /// <summary>
    /// Neutral, informational tone.
    /// </summary>
    Neutral = 1,

    /// <summary>
    /// Narrative or story-like tone.
    /// </summary>
    Narrative = 2,

    /// <summary>
    /// Conversational tone.
    /// </summary>
    Conversational = 3
}
