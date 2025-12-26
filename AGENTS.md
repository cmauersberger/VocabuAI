# AI Agent Notes

## Project overview
- Backend: ASP.NET Core Minimal APIs, EF Core, PostgreSQL.
- Frontend: React Native (Expo) app in `frontend/`.

## DTO mirroring rule
- For every backend `...Dto.cs`, create a matching frontend `...Dto.ts` with the same name and field names.
- Add a `// Keep in sync with ...` comment in both files pointing to the counterpart.
  - Example (backend): `// Keep in sync with frontend/src/domain/dtos/flashcards/FlashCardDto.ts`
  - Example (frontend): `// Keep in sync with backend/VocabuAI.Api/Dtos/FlashCards/FlashCardDto.cs`

## Naming and endpoints
- Prefer explicit, descriptive routes (do not rely solely on HTTP verbs).
- Use Minimal API mappings (no controllers).

## Data access
- Keep query logic in repositories, not in endpoints.
- Never trust client input for user identity; derive user id from claims.
