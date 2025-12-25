using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using VocabuAI.Api.Infrastructure;
using VocabuAI.Infrastructure.Database.Entities;
using VocabuAI.Infrastructure.Repositories;

namespace VocabuAI.Api.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/auth/token", (TokenRequest request, IOptions<JwtOptions> options, IUserRepository users, IPasswordHasher<UserDb> hasher) =>
            {
                var email = NormalizeEmail(request.Email);
                if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(request.Password))
                    return Results.BadRequest(new { message = "Email and password are required." });

                var user = users.GetByEmail(email);
                if (user is null)
                    return Results.Unauthorized();

                var verified = hasher.VerifyHashedPassword(user, user.HashedPassword, request.Password);
                if (verified == PasswordVerificationResult.Failed)
                    return Results.Unauthorized();

                var jwt = options.Value;
                var keyBytes = Encoding.UTF8.GetBytes(jwt.SigningKey);
                var signingKey = new SymmetricSecurityKey(keyBytes);
                var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

                var claims = new[]
                {
                    new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                    new Claim(JwtRegisteredClaimNames.Email, user.Email),
                    new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N"))
                };

                var token = new JwtSecurityToken(
                    issuer: jwt.Issuer,
                    audience: jwt.Audience,
                    claims: claims,
                    expires: DateTime.UtcNow.AddHours(8),
                    signingCredentials: credentials
                );

                var tokenString = new JwtSecurityTokenHandler().WriteToken(token);
                return Results.Ok(new TokenResponse(AccessToken: tokenString, TokenType: "Bearer"));
            })
            .AllowAnonymous()
            .WithTags("Auth")
            .WithName("CreateToken");
    }

    private static string NormalizeEmail(string email)
        => email.Trim().ToLowerInvariant();
}

public sealed record TokenRequest(string Email, string Password);
public sealed record TokenResponse(string AccessToken, string TokenType);
