using Microsoft.AspNetCore.Authorization;
using VocabuAI.Infrastructure.Database.Entities;
using VocabuAI.Infrastructure.Repositories;
using Microsoft.AspNetCore.Identity;
using VocabuAI.Api.Infrastructure;

namespace VocabuAI.Api.Endpoints;

public static class UserEndpoints
{
    private const string SignupFailureMessage = "Signup is currently not possible. Please check your invite code.";
    private sealed class UserEndpointsLogging { }

    public static void MapUserEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/users/CreateUser", (
                CreateUserRequest request,
                IUserRepository users,
                IPasswordHasher<UserDb> hasher,
                IConfiguration configuration,
                ILogger<UserEndpointsLogging> logger) =>
            {
                var email = NormalizeEmail(request.Email);
                var userName = NormalizeUserName(request.UserName);
                if (string.IsNullOrWhiteSpace(email))
                    return Results.BadRequest(new { message = "Email is required." });
                if (!IsValidUserName(userName))
                    return Results.BadRequest(new { message = "User name must be at least 3 characters (excluding spaces)." });
                if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 8)
                    return Results.BadRequest(new { message = "Password must be at least 8 characters." });
                if (string.IsNullOrWhiteSpace(request.InviteToken))
                    return Results.BadRequest(new { message = "Invite code is required." });

                if (users.GetUserCount() >= SignupLimits.MaxUserCount)
                {
                    logger.LogInformation("Signup rejected due to user capacity.");
                    return Results.Json(new { message = SignupFailureMessage },
                        statusCode: StatusCodes.Status403Forbidden);
                }

                var inviteHash = configuration["Invite:TokenHash"] ?? "";
                if (!InviteTokenHasher.IsValid(request.InviteToken, inviteHash))
                {
                    logger.LogInformation("Signup rejected due to invalid invite token.");
                    return Results.Json(new { message = SignupFailureMessage },
                        statusCode: StatusCodes.Status403Forbidden);
                }

                var existing = users.GetByEmail(email);
                if (existing is not null)
                {
                    logger.LogInformation("Signup rejected due to email conflict.");
                    return Results.Json(new { message = SignupFailureMessage },
                        statusCode: StatusCodes.Status403Forbidden);
                }

                var user = new UserDb { Email = email, UserName = userName };
                user.HashedPassword = hasher.HashPassword(user, request.Password);

                if (!users.TryAddUserWithLimit(user, SignupLimits.MaxUserCount))
                {
                    logger.LogInformation("Signup rejected due to user capacity.");
                    return Results.Json(new { message = SignupFailureMessage },
                        statusCode: StatusCodes.Status403Forbidden);
                }

                var response = new UserResponse(user.Id, user.Email, user.UserName, user.DateTimeCreated, user.DateTimeUpdated);
                return Results.Created($"/api/users/GetUser/{user.Id}", response);
            })
            .AllowAnonymous()
            .WithTags("Users")
            .WithName("CreateUser")
            .RequireRateLimiting("signup");

        app.MapPut("/api/users/UpdateUser/{id:int}", (int id, UpdateUserRequest request, IUserRepository users, IPasswordHasher<UserDb> hasher) =>
            {
                if (string.IsNullOrWhiteSpace(request.Email) &&
                    string.IsNullOrWhiteSpace(request.Password) &&
                    string.IsNullOrWhiteSpace(request.UserName))
                    return Results.BadRequest(new { message = "Email, user name, or password is required." });

                var user = users.GetById(id);
                if (user is null) return Results.NotFound();

                if (!string.IsNullOrWhiteSpace(request.Email))
                {
                    var email = NormalizeEmail(request.Email);
                    if (string.IsNullOrWhiteSpace(email))
                        return Results.BadRequest(new { message = "Email is required." });

                    if (!string.Equals(user.Email, email, StringComparison.Ordinal))
                    {
                        var existing = users.GetByEmail(email);
                        if (existing is not null && existing.Id != id)
                            return Results.Conflict(new { message = "Email is already in use." });

                        user.Email = email;
                    }
                }

                if (!string.IsNullOrWhiteSpace(request.UserName))
                {
                    var userName = NormalizeUserName(request.UserName);
                    if (!IsValidUserName(userName))
                        return Results.BadRequest(new { message = "User name must be at least 3 characters (excluding spaces)." });

                    user.UserName = userName;
                }

                if (!string.IsNullOrWhiteSpace(request.Password))
                {
                    if (request.Password.Length < 8)
                        return Results.BadRequest(new { message = "Password must be at least 8 characters." });

                    user.HashedPassword = hasher.HashPassword(user, request.Password);
                }

                users.Update(user);
                users.SaveChanges();

                var response = new UserResponse(user.Id, user.Email, user.UserName, user.DateTimeCreated, user.DateTimeUpdated);
                return Results.Ok(response);
            })
            .RequireAuthorization()
            .WithTags("Users")
            .WithName("UpdateUser");
    }

    private static string NormalizeEmail(string email)
        => email.Trim().ToLowerInvariant();

    private static string NormalizeUserName(string userName)
        => userName.Trim();

    private static bool IsValidUserName(string userName)
        => userName.Replace(" ", "", StringComparison.Ordinal).Length >= 3;
}

public sealed record CreateUserRequest(string Email, string UserName, string Password, string InviteToken);
public sealed record UpdateUserRequest(string? Email, string? UserName, string? Password);
public sealed record UserResponse(int Id, string Email, string UserName, DateTimeOffset DateTimeCreated, DateTimeOffset DateTimeUpdated);
