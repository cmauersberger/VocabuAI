using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using VocabuAI.Application.Security;

namespace VocabuAI.Infrastructure;

public sealed class SecretProtector : ISecretProtector
{
    private const int NonceSize = 12;
    private const int TagSize = 16;
    private const string Prefix = "v1";
    private readonly byte[]? _key;

    public SecretProtector(IConfiguration configuration)
    {
        var raw = configuration["APP_SECRET_ENCRYPTION_KEY"]
            ?? Environment.GetEnvironmentVariable("APP_SECRET_ENCRYPTION_KEY");
        if (!string.IsNullOrWhiteSpace(raw))
        {
            _key = SHA256.HashData(Encoding.UTF8.GetBytes(raw));
        }
    }

    public bool IsEnabled => _key is { Length: > 0 };

    public string Encrypt(string plaintext)
    {
        if (!IsEnabled)
        {
            throw new InvalidOperationException("OpenAI secrets are disabled because APP_SECRET_ENCRYPTION_KEY is missing.");
        }

        if (plaintext is null)
        {
            throw new ArgumentNullException(nameof(plaintext));
        }

        var nonce = RandomNumberGenerator.GetBytes(NonceSize);
        var plaintextBytes = Encoding.UTF8.GetBytes(plaintext);
        var cipherBytes = new byte[plaintextBytes.Length];
        var tag = new byte[TagSize];

        using (var aes = new AesGcm(_key!, TagSize))
        {
            aes.Encrypt(nonce, plaintextBytes, cipherBytes, tag);
        }

        var nonceBase64 = Convert.ToBase64String(nonce);
        var cipherBase64 = Convert.ToBase64String(cipherBytes);
        var tagBase64 = Convert.ToBase64String(tag);

        return $"{Prefix}.{nonceBase64}.{cipherBase64}.{tagBase64}";
    }

    public string Decrypt(string ciphertext)
    {
        if (!IsEnabled)
        {
            throw new InvalidOperationException("OpenAI secrets are disabled because APP_SECRET_ENCRYPTION_KEY is missing.");
        }

        if (string.IsNullOrWhiteSpace(ciphertext))
        {
            throw new ArgumentException("Ciphertext is required.", nameof(ciphertext));
        }

        var parts = ciphertext.Split('.', 4);
        if (parts.Length != 4 || parts[0] != Prefix)
        {
            throw new FormatException("Ciphertext format is invalid.");
        }

        var nonce = Convert.FromBase64String(parts[1]);
        var cipherBytes = Convert.FromBase64String(parts[2]);
        var tag = Convert.FromBase64String(parts[3]);
        var plaintextBytes = new byte[cipherBytes.Length];

        using (var aes = new AesGcm(_key!, TagSize))
        {
            aes.Decrypt(nonce, cipherBytes, tag, plaintextBytes);
        }

        return Encoding.UTF8.GetString(plaintextBytes);
    }
}
