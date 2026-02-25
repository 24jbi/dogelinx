# Fix: Download & API Not Working on Vercel

## TL;DR - 3 Step Fix

### Problem
Frontend on Vercel can't reach backend, so all API calls fail with 405 or return HTML.

### Solution

**Step 1: Deploy your backend to Render**
```bash
# Push to GitHub
git push origin main

# Go to https://render.com/dashboard
# New → Web Service → Connect repo → Configure:
Build Command: cd backend && npm install  
Start Command: npm start
```
After deployment, note the URL: `https://your-backend-xxxxx.onrender.com`

**Step 2: Set environment variable in Vercel**
```
Go to Vercel Dashboard
  → Your Project
  → Settings
  → Environment Variables
  → Add new:

VITE_API_URL = https://your-backend-xxxxx.onrender.com
```

**Step 3: Redeploy to Vercel**
```
In Vercel Dashboard:
  → Deployments
  → Click latest deployment "..."
  → Redeploy
```

## What Changed in Your Code

1. **`apiConfig.js`** - Now properly detects production vs development and logs which URL it's using
2. **`studioDownload.js`** - Now uses centralized API config and gives better error messages
3. **`vercel.json`** - Added (for future optimization of API routing)
4. **`deploy/vercel/SETUP_GUIDE.md`** - Detailed setup instructions

## Testing

After redeploy, check browser console:
```javascript
// Should log to console:
// "Production mode - using Render backend"
// "Downloading studio from: https://your-backend-xxxxx.onrender.com"
```

If you see `http://localhost:4000` or old Railway URL, the Vercel redeploy didn't work.

## Common Issues

**Still getting 405?**
- [ ] Is backend deployed and running? (Check Render dashboard)
- [ ] Did you set `VITE_API_URL` in Vercel?
- [ ] Did you click "Redeploy" in Vercel?
- [ ] Did you hard-refresh browser? (Ctrl+Shift+R)

**Getting HTML in response?**
- Backend isn't deployed
- API URL is wrong
- Vercel wasn't redeployed

**Download still fails after fix?**
```bash
# Test backend directly:
curl https://your-backend-xxxxx.onrender.com/api/games

# Should return: {"ok":true,"games":[]}
# If not working, backend has an issue
```

## Important Notes

- **Don't use relative paths** like `/api/download` on Vercel—they route to frontend HTML
- **Backend must be separate** from Vercel because Vercel is serverless (no WebSocket support)
- **Render is best for backend** (native WebSocket, cheap, fast setup)
- **Environment variables** are the key—without `VITE_API_URL`, frontend guesses wrong

After this fix, downloads, games, items, avatars should all work!
