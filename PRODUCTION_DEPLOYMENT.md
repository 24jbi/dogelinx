# DogeLinx Production Deployment Guide

This guide helps you deploy DogeLinx to production with the new monorepo structure.

## Architecture Overview

```
DogeLinx Monorepo
├── client/          (React SPA - deploy to Vercel)
├── backend/         (Express + WebSocket - deploy to Render/DO/Fly)
├── desktop/         (Electron app - build locally)
└── shared/          (Shared types and protocols)
```

## Recommended Deployment Stack

### Frontend: Vercel
- **What**: React SPA (built by client/)
- **Why**: Free tier, automatic deploys from git, global CDN
- **Cost**: Free tier + $20/mo for pro features
- **Deploy**: 
  ```bash
  npm run build:web
  # Connect git to Vercel, it auto-builds
  ```

### Backend: Render (Recommended for Starting Out)
- **What**: Node.js + Express + WebSocket server
- **Why**: Native WebSocket support, simple management, free tier available
- **Cost**: Free tier (limited), then $7-12/mo starter tier
- **Deploy**:
  ```bash
  # Push to GitHub
  # Connect repo to Render
  # Set build command: cd backend && npm install
  # Set start command: npm start
  ```

### Alternative Backend Options

#### DigitalOcean App Platform (Most Stable Pricing)
- **Cost**: $5-12/mo per app
- **Pros**: Clear pricing, good reliability, built-in monitoring
- **Deploy**: Connect GitHub → auto-deploys
- **Setup**: Use `Procfile` or configure buildpack

#### Fly.io (Best for Multiplayer at Scale)
- **Cost**: Pay per resource usage (~$5-15/mo minimum)
- **Pros**: GeoDNS, close to users, built for realtime
- **Deploy**: `fly deploy`
- **Setup**: Use `fly.toml` configuration

#### Hetzner VPS (If You Want Full Control)
- **Cost**: €3-5/mo for basic server
- **Pros**: Full Linux control, very cheap
- **Cons**: You manage updates, security, backups
- **Deploy**: SSH + deploy scripts

### Database & Storage: Supabase (You Already Have This!)
- **What**: PostgreSQL + Auth + Real-time + Storage
- **Cost**: Free tier sufficient for small projects, paid plans from $25/mo
- **Use**: Already integrated in your app

## Quick Start: Deploy to Render

### Step 1: Prepare Code
```bash
# In d:\dogelinx
git init
git add .
git commit -m "Initial monorepo commit"
git branch -M main
```

### Step 2: Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/dogelinx.git
git push -u origin main
```

### Step 3: Create Render Service
1. Go to [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub account & select `dogelinx` repo
4. Configure:
   - **Name**: dogelinx-backend
   - **Region**: Pick closest to your users
   - **Branch**: main
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
   - **Instance Type**: Free (or Starter for production)

### Step 4: Set Environment Variables in Render
```
VITE_API_URL=https://dogelinx-backend.onrender.com
# Any other .env variables you need
```

### Step 5: Deploy Frontend to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Import project from GitHub
3. Set build command: `npm install && npm --workspace=client run build`
4. Set output directory: `client/dist`
5. Set environment var:
   ```
   VITE_API_URL=https://dogelinx-backend.onrender.com
   ```

## Environment Variables

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:4000  # dev
# or
VITE_API_URL=https://dogelinx-backend.onrender.com  # prod
```

### Backend (.env)
```
PORT=4000
NODE_ENV=production
LOG_LEVEL=info
# Supabase
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

## Monitoring & Debugging

### Logs
- **Render**: Dashboard → Logs tab
- **Vercel**: Deployments → Function Logs
- **Local**: `npm run dev` in each workspace

### Health Check
```bash
# Once deployed
curl https://dogelinx-backend.onrender.com/api/health
# Should return: { ok: true }
```

### Common Issues

**WebSocket connection fails**
- Check backend service is running: `curl https://YOUR_BACKEND_URL/api/health`
- Verify `VITE_API_URL` is set correctly in frontend
- Check CORS headers in backend

**File uploads fail**
- Verify disk space on server
- Check Supabase Storage is configured
- Verify upload permissions

**High latency/lag**
- Consider upgrading to paid tier on Render/Fly
- Check if too many players in one session (max 20 per session)
- Monitor WebSocket message frequency vs rate limits

## Scaling for More Users

### Stage 1: Single Backend Instance (0-100 concurrent players)
- Current Render Starter: $7-12/mo
- Works fine for testing

### Stage 2: Multiple Instances (100-500 concurrent)
- Switch to Fly.io with multiple regions
- Use Redis for session backplane
- Implement sticky sessions (user keeps same backend)

### Stage 3: Dedicated Infrastructure (500+ concurrent)
- Kubernetes cluster (ECS, GKE, or self-managed)
- Multiple backend instances with load balancing
- Separate game session servers
- CDN for static assets
- Dedicated database replicas

## Best Practices

✅ DO:
- Keep `.env` files out of git
- Monitor server costs weekly
- Set up error tracking (Sentry recommended)
- Use HTTPS only
- Rate-limit API endpoints
- Validate all user input

❌ DON'T:
- Commit secrets to git
- Use localhost in production configs
- Skip SSL/TLS
- Ignore rate limits in multiplayer
- Store large files in database

## Rollback & Disaster Recovery

### Quick Rollback (Render)
```
Dashboard → Deployments → Click previous version → "Redeploy"
```

### Database Backup (Supabase)
- Automatic daily backups (free tier)
- Keep local exports weekly

## Next Steps

1. ✅ Organize repo into monorepo (✓ Done!)
2. ✅ Add production safety features (✓ Done!)
3. → Test locally: `npm run dev:all`
4. → Push to GitHub
5. → Deploy frontend to Vercel
6. → Deploy backend to Render/DO
7. → Test multiplayer with deployed services
8. → Add monitoring & error tracking
9. → Plan for scaling

