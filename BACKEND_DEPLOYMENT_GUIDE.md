# Backend Deployment Guide

Your backend server is **currently running only on localhost:4000**, which doesn't work on Vercel production. You need to deploy it to a public server.

## Quick Summary

The frontend (dogelinx.vercel.app) tries to reach your backend at `http://localhost:4000`, which fails because:
- Vercel's serverless functions can't access your local machine
- Your local backend isn't accessible from the internet

**Solution**: Deploy the backend to a production server and set the `VITE_API_URL` environment variable on Vercel.

---

## Deployment Options (Easiest to Hardest)

### Option 1: Render.com (Recommended - FREE tier available)

**Pros**: Free tier, automatic deploys, built-in monitoring  
**Time**: ~5 minutes

#### Step 1: Prepare Your Backend

Go to the server directory and ensure `package.json` is ready:

```bash
cd server
cat package.json
```

Verify it has these dependencies:
```json
{
  "dependencies": {
    "express": "^4.x",
    "cors": "^2.x",
    "multer": "^1.x",
    "archiver": "^5.x",
    "ws": "^8.13.0",
    "nanoid": "^3.x"
  }
}
```

#### Step 2: Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub (recommended) or email
3. Click "Create New" → "Web Service"

#### Step 3: Connect Repository

1. Select your GitHub repo (or create one first)
2. Select the branch (usually `main`)
3. Name: `dogelinx-backend`
4. Environment: `Node`
5. Build Command: `cd server && npm install`
6. Start Command: `cd server && node index.js`

#### Step 4: Set Environment Variables

In Render dashboard, go to "Environment":
```
PORT=4000
NODE_ENV=production
```

#### Step 5: Deploy

1. Click "Deploy"
2. Wait for build to complete (~2-3 minutes)
3. Copy the service URL (e.g., `https://dogelinx-backend.onrender.com`)

#### Step 6: Update Vercel

Set the backend URL on your Vercel project:

```bash
vercel env add production VITE_API_URL https://dogelinx-backend.onrender.com
```

Then redeploy:
```bash
vercel deploy --prod
```

**Done!** Your app should now work on production.

---

### Option 2: Railway.app (Also FREE tier)

**Pros**: Generous free tier, simple UI  
**Time**: ~5 minutes

#### Step 1: Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Create a new project → "Deploy from GitHub repo"
4. Select your repository

#### Step 2: Configure

Railway should auto-detect this is a Node.js project. If not:

Create `railway.json` in root:
```json
{
  "build": {
    "builder": "nixpacks"
  }
}
```

#### Step 3: Set Start Command

In Railway dashboard → Variables:
```
START_CMD=cd server && node index.js
```

#### Step 4: Get URL

1. Click "Deployments" tab
2. Copy the generated URL (e.g., `https://dogelinx-xxx.railway.app`)
3. Add `/api` to confirm it works: `https://dogelinx-xxx.railway.app/api/games`

#### Step 5: Update Vercel

```bash
vercel env add production VITE_API_URL https://dogelinx-xxx.railway.app
vercel deploy --prod
```

---

### Option 3: Heroku (Paid, was free)

**Pros**: Established platform, good docs  
**Cost**: $7/month minimum (free tier discontinued)

#### Step 1: Create Account & Install CLI

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login
```

#### Step 2: Create App

```bash
heroku create dogelinx-backend
```

#### Step 3: Deploy

```bash
git push heroku main
```

#### Step 4: Get URL

```bash
heroku apps:info dogelinx-backend
# Look for "Web URL"
```

#### Step 5: Update Vercel

```bash
vercel env add production VITE_API_URL https://dogelinx-backend.herokuapp.com
vercel deploy --prod
```

---

### Option 4: DigitalOcean App Platform

**Pros**: Reliable, affordable  
**Cost**: $12/month or pay-as-you-go  
**Time**: ~10 minutes

1. Create account at [digitalocean.com](https://digitalocean.com)
2. Create App → GitHub repository
3. Configure runtime settings
4. Set build command: `npm install`
5. Set start command: `cd server && node index.js`
6. Deploy and get URL

---

### Option 5: Self-Hosted (Advanced)

If you want full control:

**VPS Options**:
- DigitalOcean Droplet (~$5/month)
- Linode (~$5/month)
- AWS EC2 (free tier for 12 months)
- Google Cloud (free tier)

**Steps**:
1. Create a VPS with Node.js pre-installed
2. Clone your repository
3. Run: `cd server && npm install && node index.js`
4. Set up reverse proxy (nginx) to handle traffic
5. Get your server's public IP/domain
6. Set `VITE_API_URL` to that IP/domain on Vercel

---

## Testing Your Deployment

After deploying the backend:

### Test Backend is Working

```bash
curl https://your-backend-url.com/api/games
# Should return JSON, not HTML error
```

### Verify Vercel URL is Set

```bash
vercel env ls
# Should show:
# VITE_API_URL=https://your-backend-url.com (production)
```

### Redeploy Frontend

```bash
# Redeploy to production
vercel deploy --prod

# Or use the dashboard to trigger a rebuild
```

### Test in Browser

1. Go to https://dogelinx.vercel.app
2. Open Developer Tools → Network tab
3. Navigate to a game or try loading items
4. You should see requests to your backend URL (not localhost:4000)
5. Responses should be JSON, not HTML errors

---

## Troubleshooting

### Still Getting "<!DOCTYPE" Errors

**Problem**: Frontend is still getting HTML instead of JSON

**Solutions**:
```bash
# 1. Verify VITE_API_URL is set on Vercel
vercel env ls

# 2. Make sure you redeployed after setting env var
vercel deploy --prod

# 3. Clear browser cache (Ctrl+Shift+Delete)

# 4. Check backend is actually running
curl https://your-backend-url.com/api/games
# Should return JSON array, not HTML
```

### 405 Method Not Allowed

**Problem**: POST requests failing with 405

**Reason**: API proxy isn't configured or backend URL is wrong

**Solution**:
```bash
# Test your backend directly
curl -X POST https://your-backend-url.com/api/download-studio
# Should return ZIP file or proper error

# If it fails, your backend might not be deployed correctly
```

### Connection Refused / Timeout

**Problem**: Backend URL configured but request times out

**Reasons**:
- Backend server isn't running on that URL
- Firewall blocking connections
- Deployment failed silently

**Solutions**:
```bash
# Test database files exist
ls server/data/
# Should show: games.json, users.json, items.json, avatars.json

# Restart backend with verbose output
cd server && NODE_ENV=production node index.js

# Check logs on Render/Railway dashboard
```

---

## Current Architecture

```
┌─────────────────────┐
│  dogelinx.vercel.app │  (Frontend - React)
│                      │
│  /api/games (request)│
│      ↓               │
│  api/[...api].js     │  (Serverless Proxy)
│      ↓               │
└─────────────────────┘
          ↓ (forwards to)
    VITE_API_URL
          ↓
┌─────────────────────┐
│  Backend Server     │  (Node.js + WebSocket)
│  (Render/Railway)   │
│                      │
│  localhost:4000      │  (LOCAL DEV)
│  https://xxx.onrender.com│  (PRODUCTION)
└─────────────────────┘
```

---

## After Deployment

Once your backend is deployed and working:

1. ✅ `/api/games` returns game list
2. ✅ `/api/items` returns items
3. ✅ `/api/download-studio` returns ZIP file
4. ✅ WebSocket connections work for multiplayer
5. ✅ No more "<!DOCTYPE" JSON errors

**You're done! Your app is ready for production.**

---

## Maintenance

### To Update Backend After Deployment

**Render/Railway**: Usually automatic with GitHub integration
- Push code to GitHub → Auto-deploys

**Manual Update**:
```bash
# Push changes to GitHub
git add server/
git commit -m "Backend updates"
git push origin main

# The platform will auto-redeploy (takes ~1-2 minutes)
```

### Monitoring

Most platforms provide:
- Logs viewer → check for errors
- Resource usage → CPU, memory, bandwidth
- Deployment history → rollback if needed

---

## Cost Summary

| Platform | Cost | Setup Time | Recommendation |
|----------|------|-----------|---|
| **Render** | FREE (limited) | 5 min | ⭐ Best |
| **Railway** | FREE tier | 5 min | ⭐ Good |
| **Heroku** | $7/month | 10 min | OK (paid) |
| **DigitalOcean** | $5/month+ | 15 min | Good (self-hosted) |

**For hobby/testing**: Use Render or Railway (free tier)  
**For production**: Use Railway, DigitalOcean, or AWS

---

## Next Steps

1. **Choose a platform** (Render recommended)
2. **Deploy backend** (5 minutes)
3. **Get backend URL** (from deployment dashboard)
4. **Set VITE_API_URL on Vercel**:
   ```bash
   vercel env add production VITE_API_URL https://your-backend.com
   ```
5. **Redeploy frontend**:
   ```bash
   vercel deploy --prod
   ```
6. **Test in browser** - should work!

---

**Questions?** Check your platform's documentation or the deployment logs.
