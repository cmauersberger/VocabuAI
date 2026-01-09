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

### Local secrets

For local dev, put connection strings and invite token hash in `backend/VocabuAI.Api/appsettings.Development.local.json` (this file is gitignored). The app loads it automatically so you don't need to export env vars for local work.

### Configuration

- Required: `DATABASE_URL` (e.g. `postgresql://user:password@localhost:5432/vocabuai`)
- Required: `JWT_SECRET` (>= 32 chars) or `Jwt__SigningKey`
- Required: `INVITE_TOKEN_HASH` (SHA-256 hex of your invite token)
- Optional: `Jwt__Issuer`, `Jwt__Audience`
- Automatic: EF Core migrations run on startup. Warning: this can lock tables, delay startup, and requires schema-altering DB permissions.

To generate an invite token hash locally:

```powershell
$token = -join ((48..57)+(65..90)+(97..122) | Get-Random -Count 32 | ForEach-Object { [char]$_ })
$hash = (New-Object System.Security.Cryptography.SHA256Managed).ComputeHash([System.Text.Encoding]::UTF8.GetBytes($token))
$hex = -join ($hash | ForEach-Object { $_.ToString('x2') })
$token
$hex
```

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

### Deploy (Web)

The web build is static and bakes the API base URL at build time.

```bash
cd frontend
docker build -t vocabuai-frontend .
docker run -p 8080:80 vocabuai-frontend
```

The Dockerfile sets `EXPO_PUBLIC_API_BASE` to `https://vocabuai.fryy.de/api` for the production build.

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
