## VocabuAI (Monorepo)

Minimal build-ready monorepo:

- Backend: ASP.NET Core minimal APIs (.NET 8 LTS), JWT auth, CRUD, Ollama REST integration
- Frontend: Expo + React Native (TypeScript) targeting Web and Android

### Structure

```
/backend
  /VocabuAI.Api
/frontend
```

## Backend

### Prereqs

- .NET SDK 8.x

### Run

```bash
dotnet restore .\\backend\\VocabuAI.sln
dotnet run --project .\\backend\\VocabuAI.Api\\VocabuAI.Api.csproj
```

- Swagger UI (Development): `http://localhost:5080/swagger`

### Quick API flow

1) Create a JWT:

```bash
curl -X POST http://localhost:5080/auth/token -H "Content-Type: application/json" -d "{\"username\":\"demo\",\"password\":\"demo\"}"
```

2) Use it with protected endpoints:

- `GET http://localhost:5080/api/memos`
- `POST http://localhost:5080/api/llm/generate` (expects Ollama at `http://localhost:11434`)

## Frontend

### Prereqs

- Node.js 18+ (recommended)
- Android Studio + emulator (for Android), or a physical Android device

### Install

```bash
cd frontend
npm install
```

### Run (Web)

```bash
cd frontend
npm run web
```

### Run (Android)

```bash
cd frontend
npm run android
```

## Concept docs

- `concept/app-concept.md`
- `concept/ui-concept.md`
