using System.Security.Cryptography;
using System.Text;

namespace VocabuAI.Api.Infrastructure;

public static class InviteTokenHasher
{
    public static bool IsValid(string token, string expectedHashHex)
    {
        if (string.IsNullOrWhiteSpace(token) || !TryDecodeHex(expectedHashHex, out var expectedBytes))
        {
            return false;
        }

        var actualBytes = HashToken(token);
        return CryptographicOperations.FixedTimeEquals(actualBytes, expectedBytes);
    }

    public static bool IsValidHashFormat(string? expectedHashHex)
        => TryDecodeHex(expectedHashHex, out _);

    private static byte[] HashToken(string token)
    {
        using var sha256 = SHA256.Create();
        return sha256.ComputeHash(Encoding.UTF8.GetBytes(token));
    }

    private static bool TryDecodeHex(string? hex, out byte[] bytes)
    {
        if (string.IsNullOrWhiteSpace(hex))
        {
            bytes = Array.Empty<byte>();
            return false;
        }

        try
        {
            bytes = Convert.FromHexString(hex);
            return bytes.Length == 32;
        }
        catch (FormatException)
        {
            bytes = Array.Empty<byte>();
            return false;
        }
    }
}
