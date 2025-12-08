# VocabuAI Backend

Backend API server for the VocabuAI application.

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Start Production
```bash
npm start
```

## API Endpoints

- `GET /` - Welcome message
- `GET /health` - Health check endpoint

## Environment Variables

Copy `.env.example` to `.env` and configure:
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
