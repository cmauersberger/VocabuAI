using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using VocabuAI.Api.Infrastructure;

namespace VocabuAI.Api.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/auth/token", (TokenRequest request, IOptions<JwtOptions> options) =>
            {
                var jwt = options.Value;
                var keyBytes = Encoding.UTF8.GetBytes(jwt.SigningKey);
                var signingKey = new SymmetricSecurityKey(keyBytes);
                var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

                var claims = new[]
                {
                    new Claim(JwtRegisteredClaimNames.Sub, request.Username),
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
}

public sealed record TokenRequest(string Username, string Password);
public sealed record TokenResponse(string AccessToken, string TokenType);
