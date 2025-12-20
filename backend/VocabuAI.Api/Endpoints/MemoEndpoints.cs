using Microsoft.AspNetCore.Authorization;
using VocabuAI.Api.Domain;
using VocabuAI.Api.Infrastructure;

namespace VocabuAI.Api.Endpoints;

public static class MemoEndpoints
{
    public static void MapMemoEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/memos", (InMemoryMemoStore store) => Results.Ok(store.List()))
            .RequireAuthorization()
            .WithTags("Memos")
            .WithName("ListMemos");

        app.MapGet("/api/memos/{id:guid}", (Guid id, InMemoryMemoStore store) =>
            {
                var memo = store.Get(id);
                return memo is null ? Results.NotFound() : Results.Ok(memo);
            })
            .RequireAuthorization()
            .WithTags("Memos")
            .WithName("GetMemo");

        app.MapPost("/api/memos", (CreateMemoRequest request, InMemoryMemoStore store) =>
            {
                if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Content))
                    return Results.BadRequest(new { message = "Title and content are required." });

                var memo = store.Create(request);
                return Results.Created($"/api/memos/{memo.Id}", memo);
            })
            .RequireAuthorization()
            .WithTags("Memos")
            .WithName("CreateMemo");

        app.MapPut("/api/memos/{id:guid}", (Guid id, UpdateMemoRequest request, InMemoryMemoStore store) =>
            {
                if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Content))
                    return Results.BadRequest(new { message = "Title and content are required." });

                var existing = store.Get(id);
                if (existing is null) return Results.NotFound();

                var updated = store.Update(id, request);
                return Results.Ok(updated);
            })
            .RequireAuthorization()
            .WithTags("Memos")
            .WithName("UpdateMemo");

        app.MapDelete("/api/memos/{id:guid}", (Guid id, InMemoryMemoStore store) =>
            store.Delete(id) ? Results.NoContent() : Results.NotFound())
            .RequireAuthorization()
            .WithTags("Memos")
            .WithName("DeleteMemo");
    }
}
