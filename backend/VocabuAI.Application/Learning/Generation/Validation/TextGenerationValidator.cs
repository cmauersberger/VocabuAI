using VocabuAI.Application.Learning.Generation.Contracts;

namespace VocabuAI.Application.Learning.Generation.Validation;

/// <summary>
/// Backend-only validator for generated AI text.
/// </summary>
public sealed class TextGenerationValidator
{
    /// <summary>
    /// Validates a generated text against a generation request.
    /// </summary>
    public TextGenerationValidationResult Validate(TextGenerationRequest request, GeneratedText generatedText)
    {
        if (request is null)
        {
            return TextGenerationValidationResult.Failure("Request is missing.");
        }

        if (generatedText is null)
        {
            return TextGenerationValidationResult.Failure("Generated text is missing.");
        }

        var wordCount = CountWords(generatedText.Text);
        if (wordCount < request.MinWordCount)
        {
            Console.WriteLine(
                $"Warning: Word count {wordCount} is below minimum {request.MinWordCount}.");
        }

        if (wordCount > request.MaxWordCount)
        {
            Console.WriteLine(
                $"Warning: Word count {wordCount} exceeds maximum {request.MaxWordCount}.");
        }

        // TODO: Validate allowed vocabulary lemmas.
        // TODO: Validate allowed grammar concepts.

        return TextGenerationValidationResult.Success();
    }

    private static int CountWords(string? text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return 0;
        }

        return text.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries).Length;
    }
}
