# IMMEDIATE ACTION: API Not Working - Complete Diagnostic

## Step 1: Verify Backend is Deployed (CRITICAL)

Click each link. Backend MUST return JSON, not HTML:

```
https://dogelinx-backend.onrender.com/api/games
```

If this returns:
- ✅ `{"ok":true,"games":[]}` → Backend is working
- ❌ HTML / Error 404 / Timeout → **Backend is NOT deployed**

### If Backend Not Deployed:

```bash
# 1. Go to https://render.com/dashboard
# 2. Click "New +" → "Web Service"
# 3. Connect GitHub repo
# 4. Configure exactly as shown:

Build Command: cd backend && npm install
Start Command: npm start
Environment: Node (auto)

# 5. Wait for "Live" status
# 6. Copy the URL (like https://dogelinx-backend-xxxxx.onrender.com)
```

---

## Step 2: Set Environment Variable in Vercel

```
https://vercel.com/dashboard
  → Click your project
  → Settings (tab)
  → Environment Variables
  
Add this variable:
  Name: VITE_API_URL
  Value: https://your-backend-xxxxx.onrender.com
  
Click Add
```

**IMPORTANT**: Use YOUR actual backend URL from Step 1

---

## Step 3: Redeploy Frontend in Vercel

```
https://vercel.com/dashboard
  → Click your project
  → Deployments (tab)
  → Find latest deployment
  → Click "..." menu
  → Click "Redeploy"

Wait for it to show "Ready"
```

---

## Step 4: Test It

1. Hard refresh browser: **Ctrl+Shift+R** (not Ctrl+R, must be SHIFT)
2. Open browser DevTools (F12)
3. Go to Console tab
4. Paste this and press Enter:

```javascript
fetch('https://dogelinx-backend.onrender.com/api/games').then(r => r.json()).then(console.log)
```

You should see: `{ok: true, games: Array(0)}`

---

## Step 5: Run Full Diagnostic (If Still Not Working)

Copy-paste this into browser console:

```javascript
async function diagnoseAPI() {
  console.log('🔍 Diagnostics:\n');
  
  const backends = [
    'https://dogelinx-backend.onrender.com',
    'http://localhost:4000',
  ];
  
  for (const url of backends) {
    try {
      const r = await fetch(url + '/api/games');
      const data = await r.json();
      console.log(`✅ ${url}: ${JSON.stringify(data).substring(0, 100)}`);
    } catch (e) {
      console.log(`❌ ${url}: ${e.message}`);
    }
  }
}
diagnoseAPI();
```

---

## Common Outcomes

### ✅ Backend responds, downloads work
→ You're done!

### ✅ Backend responds, but frontend says 405
→ Vercel wasn't redeployed
→ Go to Vercel → Deployments → Redeploy

### ❌ Backend doesn't respond, timeouts
→ Backend not deployed
→ Go to Render dashboard → check "Live" status
→ If not Live, deployment still happening (wait 5-10 min)

### ❌ Backend returns error data (not JSON)
→ Backend has an issue in code
→ Check backend logs in Render dashboard

---

## Nuclear Option (If Still Stuck)

Delete and rebuild everything:

```bash
# 1. Kill any local processes
taskkill /F /IM node.exe

# 2. Clean Vercel build cache
#    Vercel Dashboard → Settings → Advanced → Clear cache
#    Then redeploy

# 3. Check backend logs in Render
#    https://dashboard.render.com
#    → Your service → Logs tab
#    → Look for errors

# 4. If backend still broken, restart it:
#    https://dashboard.render.com
#    → Your service → Restart → Restart service
```

---

## The Exact URLs You Need

**Vercel Frontend:**
```
https://dogelinx-hueqqpbpi-dogeman2090-4746s-projects.vercel.app
```

**Render Backend (change xxxxx to your ID):**
```
https://dogelinx-backend-xxxxx.onrender.com
```

**Test Backend:**
```
curl https://dogelinx-backend-xxxxx.onrender.com/api/games
```

---

## If You're Still Getting Errors After All This

DM with:
1. What error do you see? (full error message)
2. What does `https://dogelinx-backend-xxxxx.onrender.com/api/games` return?
3. Did you set VITE_API_URL in Vercel? (yes/no)
4. Did you redeploy after setting it? (yes/no)
5. Console error (screenshot or paste exact error)

---

**Most Common Fix**: Just need to **set VITE_API_URL and redeploy** in Vercel 95% of the time!
