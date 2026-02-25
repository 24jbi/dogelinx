# Quick Start: Get Your App Working

## The Problem

Your frontend (dogelinx.vercel.app) is trying to reach the backend at `http://localhost:4000`, which doesn't work from the internet. Getting **"<!doctype"** (HTML instead of JSON) errors.

## The Solution (3 Steps)

### Step 1: Deploy Backend (5 minutes)

**Choose ONE platform:**

#### Render.com (Recommended)
```bash
# 1. Go to https://render.com → Sign up
# 2. Create Web Service → Connect GitHub repo
# 3. Build: npm install
# 4. Start: cd server && node index.js
# 5. Deploy → Copy the URL (e.g., https://dogelinx-back-xxx.onrender.com)
```

#### Railway.app
```bash
# 1. Go to https://railway.app → Sign up with GitHub
# 2. New Project → Deploy from GitHub
# 3. Select your repo
# 4. Set START_CMD: cd server && node index.js
# 5. Deploy → Copy URL
```

#### Heroku
```bash
npm install -g heroku
heroku login
heroku create dogelinx-backend
git push heroku main
# Copy: https://dogelinx-backend.herokuapp.com
```

### Step 2: Set Backend URL on Vercel

```bash
# Replace YOUR-BACKEND-URL with what you got from Step 1
vercel env add production VITE_API_URL https://YOUR-BACKEND-URL.com

# Example:
# vercel env add production VITE_API_URL https://dogelinx-backend.onrender.com
```

### Step 3: Redeploy Frontend

```bash
vercel deploy --prod
```

## Done! ✅

**Test it:**
1. Go to https://dogelinx.vercel.app
2. Try loading games/items
3. No more HTML errors!

---

## What Changed

### Before (Broken)
```
Frontend → localhost:4000 ❌ (not accessible from internet)
           ↓
         Vercel error page with HTML
```

### After (Fixed)
```
Frontend → https://your-backend.com ✅
           ↓
         Actual API responses (JSON)
```

---

## Verification

After deploying, verify it's working:

```bash
# Test your backend URL directly
curl https://your-backend-url.com/api/games

# Should return JSON like:
# {"ok":true,"games":[...]}

# NOT HTML like:
# <!DOCTYPE html>
```

---

## Need Help?

See [BACKEND_DEPLOYMENT_GUIDE.md](BACKEND_DEPLOYMENT_GUIDE.md) for:
- Detailed instructions for each platform
- Troubleshooting
- Cost comparison
- Self-hosting options

---

## Status Checklist

- [ ] Backend deployed to Render/Railway/Heroku
- [ ] Got backend URL (e.g., https://dogelinx-backend.onrender.com)
- [ ] Set VITE_API_URL on Vercel
- [ ] Ran `vercel deploy --prod`
- [ ] Tested in browser - games/items load ✅

**Questions?** Check the detailed guide above.
