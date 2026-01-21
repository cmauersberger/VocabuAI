namespace VocabuAI.Application.Learning.Generation.Contracts;

/// <summary>
/// Backend-only grammar concept identifiers for AI text generation.
/// </summary>
public enum GrammarConceptId
{
    /// <summary>
    /// Unspecified grammar concept.
    /// </summary>
    Unspecified = 0,

    /// <summary>
    /// Use fully vocalized Arabic text.
    /// </summary>
    ArabicFullyVocalized = 1
    ,

    /// <summary>
    /// Use present tense forms.
    /// </summary>
    PresentTense = 2,

    /// <summary>
    /// Use past tense forms.
    /// </summary>
    PastTense = 3,

    /// <summary>
    /// Use future tense forms.
    /// </summary>
    FutureTense = 4,

    /// <summary>
    /// Use imperative mood.
    /// </summary>
    ImperativeMood = 5,

    /// <summary>
    /// Use negation patterns.
    /// </summary>
    Negation = 6,

    /// <summary>
    /// Use conditional structures.
    /// </summary>
    Conditional = 7,

    /// <summary>
    /// Use passive voice constructions.
    /// </summary>
    PassiveVoice = 8,

    /// <summary>
    /// Use relative clauses.
    /// </summary>
    RelativeClauses = 9,

    /// <summary>
    /// Use pronouns.
    /// </summary>
    Pronouns = 10
}

public static class GrammarConceptIdExtensions
{
    public static string GetDescription(this GrammarConceptId concept) =>
        concept switch
        {
            GrammarConceptId.ArabicFullyVocalized => "Full vocalization with diacritics on all or nearly all words",
            GrammarConceptId.PresentTense => "Present tense forms",
            GrammarConceptId.PastTense => "Past tense forms",
            GrammarConceptId.FutureTense => "Future tense forms",
            GrammarConceptId.ImperativeMood => "Imperative mood",
            GrammarConceptId.Negation => "Negation patterns",
            GrammarConceptId.Conditional => "Conditional structures",
            GrammarConceptId.PassiveVoice => "Passive voice constructions",
            GrammarConceptId.RelativeClauses => "Relative clauses",
            GrammarConceptId.Pronouns => "Pronoun usage",
            _ => "Other specified grammar concept"
        };
}
