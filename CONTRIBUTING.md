# Contributing to VocabuAI

Thank you for your interest in contributing to VocabuAI!

## Development Setup

### Prerequisites
- Node.js 18 or higher
- npm
- Git
- For Android development: Android Studio and Android SDK
- For iOS development: macOS with Xcode

### Getting Started

1. Clone the repository:
```bash
git clone https://github.com/cmauersberger/VocabuAI.git
cd VocabuAI
```

2. Install dependencies:
```bash
npm install
```

## Project Structure

This is a monorepo managed with npm workspaces:

```
VocabuAI/
├── apps/
│   ├── vocabuai-backend/    # Backend API
│   └── vocabuai-frontend/   # React Native app
├── packages/                # Shared packages (future)
└── package.json            # Root workspace config
```

## Development Workflow

### Backend Development

Navigate to the backend directory or use workspace commands:

```bash
# Run in development mode
npm run dev:backend

# Build
npm run build:backend

# Run tests
cd apps/vocabuai-backend && npm test
```

The backend will be available at http://localhost:3000

### Frontend Development

Navigate to the frontend directory or use workspace commands:

```bash
# Start Expo development server
npm run dev:frontend

# Run on Android
cd apps/vocabuai-frontend && npm run android

# Run on iOS (macOS only)
cd apps/vocabuai-frontend && npm run ios

# Run on web
cd apps/vocabuai-frontend && npm run web
```

## Code Style

- Backend: TypeScript with ESLint
- Frontend: TypeScript with Expo/React Native conventions
- Use meaningful variable names
- Add comments for complex logic
- Follow existing code patterns

## Testing

Before submitting a pull request:

1. Test your changes locally
2. Ensure all existing tests pass
3. Add tests for new features
4. Verify both backend and frontend work together

## Submitting Changes

1. Create a new branch for your feature
2. Make your changes
3. Test thoroughly
4. Commit with clear messages
5. Push to your fork
6. Open a pull request

## Questions?

Feel free to open an issue for any questions or concerns.
