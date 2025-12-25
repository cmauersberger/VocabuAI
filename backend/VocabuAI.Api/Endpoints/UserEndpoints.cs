using Microsoft.AspNetCore.Authorization;
using VocabuAI.Infrastructure.Database.Entities;
using VocabuAI.Infrastructure.Repositories;
using Microsoft.AspNetCore.Identity;

namespace VocabuAI.Api.Endpoints;

public static class UserEndpoints
{
    public static void MapUserEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/users/CreateUser", (CreateUserRequest request, IUserRepository users, IPasswordHasher<UserDb> hasher) =>
            {
                var email = NormalizeEmail(request.Email);
                var userName = NormalizeUserName(request.UserName);
                if (string.IsNullOrWhiteSpace(email))
                    return Results.BadRequest(new { message = "Email is required." });
                if (!IsValidUserName(userName))
                    return Results.BadRequest(new { message = "User name must be at least 3 characters (excluding spaces)." });
                if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 8)
                    return Results.BadRequest(new { message = "Password must be at least 8 characters." });

                var existing = users.GetByEmail(email);
                if (existing is not null)
                    return Results.Conflict(new { message = "Email is already in use." });

                var user = new UserDb { Email = email, UserName = userName };
                user.HashedPassword = hasher.HashPassword(user, request.Password);

                users.Add(user);
                users.SaveChanges();

                var response = new UserResponse(user.Id, user.Email, user.UserName, user.DateTimeCreated, user.DateTimeUpdated);
                return Results.Created($"/api/users/GetUser/{user.Id}", response);
            })
            .AllowAnonymous()
            .WithTags("Users")
            .WithName("CreateUser");

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

public sealed record CreateUserRequest(string Email, string UserName, string Password);
public sealed record UpdateUserRequest(string? Email, string? UserName, string? Password);
public sealed record UserResponse(int Id, string Email, string UserName, DateTimeOffset DateTimeCreated, DateTimeOffset DateTimeUpdated);
