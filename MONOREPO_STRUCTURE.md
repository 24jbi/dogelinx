# DogeLinx Studio Monorepo Structure

This is now organized as an npm workspaces monorepo for better build reliability and deployment clarity.

## 📁 Folder Structure

```
dogelinx/
├── client/                   # React SPA (Vite)
│   ├── src/                 # React components & pages
│   ├── public/              # Static assets
│   ├── vite.config.js
│   ├── package.json
│   └── index.html
│
├── backend/                  # Express + WebSocket server
│   ├── index.js             # Main server
│   ├── multiplayer.js       # WebSocket engine
│   ├── data/                # File-based storage
│   ├── public/              # Served static files
│   ├── api/                 # API routes
│   ├── package.json
│   └── test-api.js
│
├── desktop/                  # Electron app
│   ├── electron-main.js
│   ├── preload.cjs
│   └── package.json
│
├── shared/                   # Shared types & protocol
│   ├── index.js             # Exports WS_MESSAGES, schemas, etc.
│   └── package.json
│
├── deploy/                   # Deployment configs (organized by platform)
│   ├── render/             # Render.com configs
│   ├── vercel/             # Vercel configs
│   └── digitalocean/       # DigitalOcean App Platform configs
│
├── PRODUCTION_DEPLOYMENT.md  # Complete deployment guide
├── package.json             # Root workspace config
├── .gitignore               # Comprehensive ignore patterns
└── README.md                # This file
```

## 🚀 Quick Start

### Install All Workspaces
```bash
npm install
```

This installs dependencies for client/, backend/, desktop/, and shared/ in one command.

### Development: Run Everything

**Option A: Backend only**
```bash
npm run server
# Backend runs on http://localhost:4000
```

**Option B: Client (Vite dev server)**
```bash
npm run dev:client
# Client runs on http://localhost:5173
```

**Option C: Both at same time**
```bash
npm run dev:all
# Backend on 4000 + Client on 5173
```

**Option D: Desktop app**
```bash
npm run electron
```

### Build for Production

```bash
# Build just the web app
npm run build:web
# Output: client/dist/

# Build desktop app
npm run build:desktop
# Output: out/
```

## 📦 Workspace Management

Each workspace (client, backend, shared, desktop) has its own:
- `package.json` (independent dependencies)
- `.gitignore` (local ignores)
- Build/run scripts

### Run Commands in Specific Workspace

```bash
# Run dev server in backend only
npm --workspace=backend run dev

# Run build in client only
npm --workspace=client run build

# Run tests in backend
npm --workspace=backend run test

# Run command in all workspaces
npm --workspaces run lint --if-present
```

## 🔒 Production Safety Features

The backend now includes:

### Rate Limiting
```javascript
// Per-connection rate limits:
- Position updates: 30/sec
- Chat messages: 5/sec
- Actions: 20/sec
```

### Ping/Pong Heartbeat
- Server sends ping every 30 sec
- Clients respond with pong
- Dead connections (5s no pong) are kicked

### Input Validation
```javascript
- Position: bounded to ±100,000 units
- Chat: max 500 chars
- Rotation: validated to be numbers
```

### Server-Authoritative State
- Server validates all state changes
- Client can't cheat positions/avatars
- Actions validated on server side

## 🎯 Environment Variables

### Frontend (.env.local)
```env
VITE_API_URL=http://localhost:4000         # Development
# or
VITE_API_URL=https://your-backend.onrender.com  # Production
```

### Backend (.env)
```env
NODE_ENV=production
PORT=4000
LOG_LEVEL=info
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
```

## 🌍 Deployment

See [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) for complete deployment guide.

**Quick Reference:**
- **Frontend**: Deploy to Vercel (free tier works)
- **Backend**: Deploy to Render ($7/mo starter) or DigitalOcean ($5/mo+)
- **Database**: Supabase (already integrated)
- **Desktop**: Build locally with `npm run build:desktop`

## 📊 Monorepo Benefits

✅ Single lockfile (`package-lock.json`)
✅ Consistent Node versions across packages
✅ Shared dependencies resolved once
✅ Workspaces can reference each other (`workspace:*`)
✅ Single `npm install` for everything
✅ Cleaner git history per workspace

## 🔧 Common Commands

| Command | What It Does |
|---------|-------------|
| `npm install` | Install all workspaces |
| `npm run server` | Start backend on 4000 |
| `npm run dev:client` | Start Vite dev server on 5173 |
| `npm run dev:all` | Run backend + client together |
| `npm run build:web` | Build React app for production |
| `npm run build:desktop` | Build Electron app |
| `npm run lint` | Lint all workspaces |
| `npm run test` | Test backend |

## 📚 Next Steps

1. ✅ Monorepo structure (done)
2. ✅ Production safety (done - rate limiting, validation, heartbeat)
3. → Test locally: `npm run dev:all`
4. → Push to GitHub
5. → Deploy frontend to Vercel
6. → Deploy backend to Render/DigitalOcean
7. → Add error tracking (Sentry)
8. → Monitor performance

## 🆘 Troubleshooting

### "Command not found: npm"
Make sure Node.js is installed: `node --version`

### "EADDRINUSE: address already in use"
Another service is using that port. Kill it:
```bash
# Port 4000 (backend)
lsof -i :4000 | grep node | awk '{print $2}' | xargs kill -9

# Windows PowerShell
netstat -ano | findstr :4000
taskkill /PID <PID> /F
```

### "Cannot find module '@dogelinx/shared'"
Run `npm install` again in root directory.

### Frontend can't connect to backend
Check `VITE_API_URL` environment variable matches backend URL.

## 📖 See Also

- [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) - Detailed production deployment
- [server/index.js](./backend/index.js) - API endpoints
- [src/utils/MultiplayerClient.js](./client/src/utils/MultiplayerClient.js) - WebSocket client
- [backend/multiplayer.js](./backend/multiplayer.js) - WebSocket server
