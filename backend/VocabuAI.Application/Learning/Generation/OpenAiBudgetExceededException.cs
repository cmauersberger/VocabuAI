namespace VocabuAI.Application.Learning.Generation;

public sealed class OpenAiBudgetExceededException : Exception
{
    public const string ErrorCode = "OPENAI_TOKEN_BUDGET_EXCEEDED";

    public OpenAiBudgetExceededException(string message)
        : base(message)
    {
    }
}
