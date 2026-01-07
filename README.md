## VocabuAI (Monorepo)

Minimal build-ready monorepo:

- Backend: ASP.NET Core minimal APIs (.NET 9), JWT auth, CRUD, Ollama REST integration
- Frontend: Expo + React Native (TypeScript) targeting Web and Android

### Structure

```
/backend
  /VocabuAI.Api
/frontend
```

## Backend

### Prereqs

- .NET SDK 9.x

### Run

```bash
dotnet restore .\\backend\\VocabuAI.sln
dotnet run --project .\\backend\\VocabuAI.Api\\VocabuAI.Api.csproj
```

- Swagger UI (Development): `http://localhost:5080/swagger`

### Configuration

- Required: `DATABASE_URL` (e.g. `postgresql://user:password@localhost:5432/vocabuai`)
- Required: `JWT_SECRET` (>= 32 chars) or `Jwt__SigningKey`
- Optional: `Jwt__Issuer`, `Jwt__Audience`
- Automatic: EF Core migrations run on startup. Warning: this can lock tables, delay startup, and requires schema-altering DB permissions.

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

### Test on an Android phone (Expo Go)

Prereqs (one-time):

- Install Expo Go from the Play Store
- Put your phone and dev machine on the same Wi‑Fi network

Run:

```bash
cd frontend
npm run start
```

Then:

- Open Expo Go on your phone → “Scan QR code” → scan the QR code shown by Expo
- If the phone can’t connect over LAN, switch Expo “Connection” to `Tunnel` (Expo UI) and scan again
- If you see an SDK mismatch warning in Expo Go, align the project `expo` SDK version in `frontend/package.json` to match

Networking notes:

- Windows Firewall/VPN can block LAN discovery; allow Node/Expo on private networks or use `Tunnel`
- When calling the backend from a real phone later, don’t use `localhost` for the API base URL; use your PC’s LAN IP (e.g. `http://192.168.1.20:5080`)

## Concept docs

- `concept/app-concept.md`
- `concept/ui-concept.md`
