# VocabuAI

An AI-powered vocabulary learning application built with a modern monorepo architecture.

## Project Structure

This is a monorepo containing the following applications:

```
VocabuAI/
├── apps/
│   ├── vocabuai-backend/    # Backend API server (Node.js + Express + TypeScript)
│   └── vocabuai-frontend/   # Frontend app (React Native + Expo + React Native Web)
├── packages/                # Shared packages (future use)
└── package.json            # Root workspace configuration
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation

Install all dependencies for the monorepo:

```bash
npm install
```

### Development

#### Run the backend:
```bash
npm run backend
```
The backend API will be available at http://localhost:3000

#### Run the frontend:
```bash
npm run frontend
```
This will start the Expo development server. You can then:
- Press `a` to open on Android emulator
- Press `i` to open on iOS simulator (macOS only)
- Press `w` to open in web browser

### Build

#### Build backend:
```bash
npm run build:backend
```

#### Build frontend:
```bash
npm run build:frontend
```

## Applications

### Backend (vocabuai-backend)
- Node.js + Express
- TypeScript
- RESTful API
- See [apps/vocabuai-backend/README.md](apps/vocabuai-backend/README.md) for more details

### Frontend (vocabuai-frontend)
- React Native
- Expo
- React Native Web (for web support)
- Cross-platform (Android, iOS, Web)
- See [apps/vocabuai-frontend/README.md](apps/vocabuai-frontend/README.md) for more details

## Tech Stack

- **Backend**: Node.js, Express, TypeScript
- **Frontend**: React Native, Expo, React Native Web
- **Monorepo**: npm workspaces
- **Languages**: TypeScript

## License

See [LICENSE](LICENSE) file for details.