# Vercel + Render Backend Setup

Your frontend is deployed on Vercel, but your API needs to be on a separate backend service that stays running (Vercel serverless functions don't work well with WebSockets).

## Quick Setup (5 minutes)

### Step 1: Deploy Backend (if not done yet)

Deploy to Render (recommended for WebSocket support):

```bash
# 1. Push your code to GitHub
git push origin main

# 2. Go to https://render.com/dashboard
# 3. Click "New +" → "Web Service"
# 4. Connect repo and configure:

Build Command: cd backend && npm install
Start Command: npm start
Environment: Node

# In Environment tab, add:
NODE_ENV = production
SUPABASE_URL = <your-url>
SUPABASE_ANON_KEY = <your-key>
```

After deployment, note the URL (e.g., `https://dogelinx-backend.onrender.com`)

### Step 2: Configure Vercel

1. Go to https://vercel.com/dashboard
2. Click on your `dogelinx` project
3. Go to **Settings** → **Environment Variables**
4. Add this variable:

```
VITE_API_URL = https://your-backend-url.onrender.com
```

(Replace with your actual Render backend URL)

5. **Redeploy** from the Deployments tab

### Step 3: Test It

After redeploying:

1. Open https://your-vercel-app.vercel.app
2. Try to download studio
3. Check the browser console for any errors
4. Verify download works or see specific error message

---

## Known Issues & Fixes

### "Express required but not installed" / 405 errors

If you're still getting 405 errors, your backend isn't deployed or VITE_API_URL isn't set.

**Fix**: 
```bash
# Verify backend is running:
curl https://your-backend-url.onrender.com/api/games -v

# Should return: {"ok":true,"games":[]}
```

If that doesn't work, redeploy backend.

### Static files returning HTML instead of data

The errors like `<!doctype` in JSON responses mean API calls are hitting your frontend instead of backend.

**Fix**: 
1. Make sure `VITE_API_URL` environment variable is set in Vercel
2. Redeploy frontend
3. Hard refresh browser: `Ctrl+Shift+R`

### Download/Games/Items still showing HTML errors

After setting `VITE_API_URL`, rebuild:

```bash
# In Vercel dashboard:
1. Go to "Deployments"
2. Click "..." on latest deployment
3. Click "Redeploy"
```

Or from command line:
```bash
cd client
npm run build
vercel deploy --prod
```

---

## Environment Variables Checklist

**Vercel (Settings → Environment Variables)**
- [ ] `VITE_API_URL` = `https://your-backend.onrender.com`

**Render Backend (Environment tab)**
- [ ] `NODE_ENV` = `production`
- [ ] `SUPABASE_URL` = your Supabase URL
- [ ] `SUPABASE_ANON_KEY` = your anon key

**Local Development .env files**

Frontend: `client/.env.local`
```env
VITE_API_URL=http://localhost:4000
```

Backend: `backend/.env`
```env
NODE_ENV=development
PORT=4000
SUPABASE_URL=<your-url>
SUPABASE_ANON_KEY=<your-key>
```

---

## How to Verify Everything Works

```bash
# 1. Check backend is responding
curl https://your-backend.onrender.com/api/games

# Expected response:
# {"ok":true,"games":[]}

# 2. Check frontend can reach backend
# Open browser console and run:
fetch('https://your-backend.onrender.com/api/items').then(r => r.json()).then(console.log)

# 3. Test download endpoint
fetch('https://your-backend.onrender.com/api/download-studio', {method:'POST'})
  .then(r => r.blob())
  .then(b => console.log('Got ZIP:', b.size, 'bytes'))
```

---

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| 405 Method Not Allowed | Backend not deployed or wrong URL | Check Render URL, set `VITE_API_URL` |
| `<!doctype` in JSON | API calls hitting frontend | Set `VITE_API_URL` in Vercel |
| Downloaded file is empty | Backend route issue | Restart backend on Render |
| CORS errors | Backend CORS config | Backend already has `cors()` enabled |
| WebSocket fails | Using Vercel serverless | That's why we use Render for backend |

---

## Alternative Backends (Instead of Render)

### DigitalOcean App Platform
```
Build: cd backend && npm install
Run: npm start
Port: 4000
Env: Same as Render
Cost: ~$5-12/mo
```

### Fly.io
```
Deploy: fly launch
Deploy: fly deploy
Cost: ~$5-15/mo
```

---

## What's Deployed Where

| Part | Platform | URL |
|------|----------|-----|
| Frontend (React) | Vercel | `https://your-app.vercel.app` |
| Backend (API + WebSocket) | Render | `https://your-backend.onrender.com` |
| Database | Supabase | Managed by you |

This architecture is production-ready and handles multiplayer WebSockets properly.
