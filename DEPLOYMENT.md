# Deployment & Configuration Guide

## 1. Environment Variables (`.env.example`)
```env
PORT=3000
NODE_ENV=development
GEMINI_API_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
C2PA_TRUST_ANCHOR_DIR=./certs
MAX_UPLOAD_SIZE_BYTES=52428800
DEFAULT_RETENTION_DAYS=30
```

## 2. Local Execution
```bash
# Install dependencies
npm install

# Run unit tests
npm test

# Launch dev server on port 3000
npm run dev
```

## 3. Production Build & Execution
```bash
# Build frontend bundle
npm run build

# Start production server
npm start
```
The server binds to `0.0.0.0:3000` and serves the static production build from `/dist` while maintaining all `/api/v1/*` endpoints.
