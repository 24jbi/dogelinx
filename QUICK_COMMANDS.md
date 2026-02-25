# Quick Command Reference

## 🚀 Development

```bash
# Start just the backend (API + WebSocket)
npm run server
# Backend runs on http://localhost:4000

# Start just the frontend (Vite dev server)
npm run dev:client
# Frontend runs on http://localhost:5173

# Start both at the same time
npm run dev:all
# Then open: http://localhost:5173

# Start desktop app (Electron)
npm run electron
```

## 🏗️ Building

```bash
# Build web app for production
npm run build:web
# Output: client/dist/

# Build desktop app
npm run build:desktop
# Output: out/ folder

# Build everything
npm run build
```

## 📦 Installing Packages

```bash
# Install all dependencies (root + all workspaces)
npm install

# Add package to backend only
npm --workspace=backend install express-new-package

# Add package to client only
npm --workspace=client install react-new-package

# Add dev package to shared
npm --workspace=shared install --save-dev typescript
```

## 🔧 Workspace Commands

```bash
# List all workspaces
npm workspaces ls

# Run test in backend
npm --workspace=backend run test

# Run lint in client
npm --workspace=client run lint

# Run lint in all workspaces
npm --workspaces run lint --if-present
```

## 🧪 Testing

```bash
# Test backend API
npm --workspace=backend run test

# Test locally before deploying
npm run dev:all
# Then open http://localhost:5173
# Create a game, invite a friend locally or use ngrok
```

## 📡 WebSocket Testing

```bash
# Check if multiplayer server is responding
curl http://localhost:4000/api/games/test123/sessions -X POST

# Watch server logs
npm run server
# Look for "player-joined", "pong" messages
```

## 🌍 Deployment

```bash
# Deploy frontend to Vercel
npm run build:web
# Then: vercel deploy (from client/ folder)

# Deploy backend to Render
# Push to GitHub, follow PRODUCTION_DEPLOYMENT.md

# Deploy desktop
npm run build:desktop
# Creates ElectronApp-0.1.0.exe
```

## 🐛 Debugging

```bash
# Check what's using port 4000 (Windows PowerShell)
netstat -ano | findstr :4000
taskkill /PID <process_id> /F

# Clear npm cache if package install fails
npm cache clean --force
npm install

# Check Node version (should be 18+)
node --version

# Check npm version (should be 9+)
npm --version
```

## 📋 Clean & Reset

```bash
# Delete all node_modules and lock file
rmdir /s node_modules
del package-lock.json

# Fresh install
npm install
```

## 📍 Important Paths

```
d:\dogelinx\
├── backend/index.js          ← Main server file
├── backend/multiplayer.js    ← WebSocket engine (with rate limiting)
├── client/src/App.jsx        ← React entry point
├── shared/index.js           ← Protocol definitions
└── deploy/                   ← Use to deploy
    ├── render/README.md      ← How to deploy to Render
    ├── vercel/README.md      ← How to deploy to Vercel
    └── digitalocean/README.md ← How to deploy to DigitalOcean
```

## 🔐 Environment Variables

Create `.env` in backend/:
```env
NODE_ENV=production
PORT=4000
LOG_LEVEL=info
SUPABASE_URL=your_url
SUPABASE_ANON_KEY=your_key
```

Create `.env.local` in client/:
```env
VITE_API_URL=http://localhost:4000        # dev
# or
VITE_API_URL=https://your-backend.onrender.com  # prod
```

## 💡 Common Issues & Fixes

**Port 4000 already in use**
```bash
taskkill /F /IM node.exe
npm run server
```

**Can't connect to backend from frontend**
```bash
# Check VITE_API_URL is set correctly
echo $env:VITE_API_URL

# Test backend is running
curl http://localhost:4000/api/games
```

**npm install fails with workspace errors**
```bash
npm cache clean --force
del package-lock.json
del ./*/node_modules -Recurse -Force
npm install
```

**Changes not showing in dev server**
```bash
# Restart Vite
npm run dev:client
# (Ctrl+C, then run again)
```

---

For more detailed info, see:
- [MONOREPO_STRUCTURE.md](./MONOREPO_STRUCTURE.md) - Architecture & setup
- [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) - How to deploy
- [REFACTORING_SUMMARY.md](./REFACTORING_SUMMARY.md) - What changed & why
