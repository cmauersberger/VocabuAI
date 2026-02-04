namespace VocabuAI.Application.Learning.Generation.Contracts;

/// <summary>
/// Common European Framework of Reference for Languages (CEFR) levels.
/// </summary>
public enum LanguageLevel
{
    /// <summary>
    /// A1 – Beginner: Can understand and use very basic expressions,
    /// introduce oneself, and interact in a simple way if the other person speaks slowly.
    /// </summary>
    A1 = 1,

    /// <summary>
    /// A2 – Elementary: Can understand frequently used expressions related to
    /// everyday topics (e.g. family, shopping, work) and communicate in simple tasks.
    /// </summary>
    A2 = 2,

    /// <summary>
    /// B1 – Intermediate: Can understand the main points of clear standard input
    /// on familiar matters and produce simple connected text.
    /// </summary>
    B1 = 3,

    /// <summary>
    /// B2 – Upper Intermediate: Can understand the main ideas of complex texts,
    /// interact with fluency, and produce clear, detailed explanations.
    /// </summary>
    B2 = 4,

    /// <summary>
    /// C1 – Advanced: Can understand a wide range of demanding texts,
    /// express ideas fluently and spontaneously, and use language flexibly.
    /// </summary>
    C1 = 5
}

public static class LanguageLevelExtensions
{
    public static string GetDescription(this LanguageLevel level) =>
        level switch
        {
            LanguageLevel.A1 => "A1 – Beginner: Very basic expressions and simple interaction.",
            LanguageLevel.A2 => "A2 – Elementary: Simple everyday communication.",
            LanguageLevel.B1 => "B1 – Intermediate: Understands main points and produces connected text.",
            LanguageLevel.B2 => "B2 – Upper Intermediate: Fluent interaction and detailed expression.",
            LanguageLevel.C1 => "C1 – Advanced: Flexible, fluent, and precise language use.",
            _ => level.ToString()
        };
}