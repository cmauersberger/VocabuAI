namespace VocabuAI.Api.Infrastructure;

public static class SignupLimits
{
    private const int MaxUsers = 10;

    public static int MaxUserCount => MaxUsers;
}
