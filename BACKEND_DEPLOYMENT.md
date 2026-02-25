# Backend Deployment Guide

Your frontend is deployed on Vercel, but your backend Node.js server isn't. This is why API calls are failing with 404/405 errors.

## Quick Solution: Deploy Backend to Render (Free)

### Step 1: Push your code to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/dogelinx.git
git push -u origin main
```

### Step 2: Create Render Account
1. Go to https://render.com
2. Sign up with GitHub
3. Click "New" → "Web Service"
4. Select your GitHub repo
5. Choose the `server` directory as root:
   - **Name**: dogelinx-api
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Plan**: Free tier
6. Add environment variable (if needed for production):
   - `PORT=4000` (Render auto-manages this, but optional)

### Step 3: After Deploy
1. Copy your Render URL (looks like: `https://dogelinx-api.onrender.com`)
2. Update your Vercel project with this environment variable:
   ```
   VITE_API_URL=https://dogelinx-api.onrender.com
   ```

### Step 4: Redeploy Frontend
```bash
vercel --prod
```

## Alternative: Use Vercel Serverless Functions (More Complex)
Move your backend routes into `/api/` folder as serverless functions.

## Troubleshooting

### Test if backend is running:
```bash
curl https://dogelinx-api.onrender.com/api/games
```

### Test frontend in development:
```bash
npm run dev
```
Then visit `http://localhost:5173` - it should have working API calls via the proxy.

### If still getting 405 on download-studio:
Make sure your backend server is actually running and check `npm run server` logs for errors.
