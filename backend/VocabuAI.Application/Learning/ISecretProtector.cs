namespace VocabuAI.Application.Security;

public interface ISecretProtector
{
    bool IsEnabled { get; }
    string Encrypt(string plaintext);
    string Decrypt(string ciphertext);
}
