# VocabuAI Monorepo Setup Guide

This guide will help you get started with the VocabuAI monorepo.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

This will install dependencies for all workspaces (backend and frontend).

### 2. Start Development

#### Option A: Run Backend Only
```bash
npm run backend
```
Access the API at: http://localhost:3000

API Endpoints:
- `GET /` - Welcome message
- `GET /health` - Health check

#### Option B: Run Frontend Only
```bash
npm run frontend
```

Then choose your platform:
- Press `a` for Android (requires Android emulator or device)
- Press `i` for iOS (requires macOS and iOS simulator)
- Press `w` for web browser

#### Option C: Run Both Simultaneously
Open two terminal windows:

Terminal 1 (Backend):
```bash
npm run backend
```

Terminal 2 (Frontend):
```bash
npm run frontend
```

## Project Structure

```
VocabuAI/
├── apps/
│   ├── vocabuai-backend/          # Backend API Server
│   │   ├── src/
│   │   │   └── index.ts           # Express server entry point
│   │   ├── package.json           # Backend dependencies
│   │   ├── tsconfig.json          # TypeScript config
│   │   └── README.md              # Backend docs
│   │
│   └── vocabuai-frontend/         # React Native App
│       ├── App.tsx                # Main app component
│       ├── app.json               # Expo configuration
│       ├── assets/                # Images and static files
│       ├── package.json           # Frontend dependencies
│       └── README.md              # Frontend docs
│
├── packages/                       # Shared packages (future)
├── package.json                   # Root workspace config
├── README.md                      # Main documentation
├── CONTRIBUTING.md                # Contribution guidelines
└── SETUP.md                       # This file
```

## Technologies Used

### Backend
- **Node.js**: JavaScript runtime
- **Express**: Web framework
- **TypeScript**: Type-safe JavaScript
- **CORS**: Cross-origin resource sharing
- **ts-node-dev**: Development server with hot reload

### Frontend
- **React Native**: Cross-platform mobile framework
- **Expo**: Development platform for React Native
- **React Native Web**: Run React Native on the web
- **TypeScript**: Type-safe development

## Building for Production

### Backend
```bash
npm run build:backend
```
The compiled JavaScript will be in `apps/vocabuai-backend/dist/`

To run in production:
```bash
cd apps/vocabuai-backend
npm start
```

### Frontend

For web:
```bash
cd apps/vocabuai-frontend
npm run web
```

For Android APK:
```bash
cd apps/vocabuai-frontend
expo build:android
```

For iOS (requires macOS):
```bash
cd apps/vocabuai-frontend
expo build:ios
```

## Environment Variables

### Backend
Copy `.env.example` to `.env` in the backend directory:
```bash
cd apps/vocabuai-backend
cp .env.example .env
```

Available variables:
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)

## Troubleshooting

### "Cannot find module" errors
Try reinstalling dependencies:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Metro bundler issues (Frontend)
Clear the cache:
```bash
cd apps/vocabuai-frontend
npx expo start -c
```

### Port already in use (Backend)
Change the PORT in `.env` or kill the process using port 3000:
```bash
lsof -ti:3000 | xargs kill -9
```

## Next Steps

1. **Backend**: Add database integration, authentication, API endpoints
2. **Frontend**: Design UI components, add navigation, integrate with backend
3. **Shared**: Create shared packages for common utilities and types
4. **Testing**: Add unit tests and integration tests
5. **CI/CD**: Set up automated testing and deployment

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Express Documentation](https://expressjs.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/)

## Need Help?

- Check the [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines
- Read the individual README files in each app directory
- Open an issue on GitHub for bugs or feature requests
