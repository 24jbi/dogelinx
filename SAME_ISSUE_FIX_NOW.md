# SAME ISSUE? Follow This NOW

## The Issue
- ❌ Cannot download anything
- ❌ Games/items return HTML instead of JSON
- ❌ 405 Method Not Allowed errors

## The Cause
99% chance: **VITE_API_URL is not set in Vercel** OR **backend is not deployed**

## What to Do RIGHT NOW

### Action 1: Check If Backend is Even Deployed (2 min)

**Go to this URL in browser:**
```
https://dogelinx-backend.onrender.com/api/games
```

**Expected response:**
```json
{"ok":true,"games":[]}
```

**If you get:**
- ✅ JSON above → Go to Action 2
- ❌ 404, error, or timeout → **Stop and deploy backend first!** Go to [here](#deploy-backend)

---

### Action 2: Verify VITE_API_URL in Vercel (3 min)

```
https://vercel.com/dashboard
  → Click your "dogelinx" project
  → Settings (top tab)
  → Environment Variables (left sidebar)
```

**Look for:** Variable named `VITE_API_URL`

**If it exists:**
- ✅ Value should be: `https://dogelinx-backend.onrender.com/`
- ❌ If missing or wrong value → Go to Action 3

**If it doesn't exist:**
- ❌ You need to add it → Go to Action 3

---

### Action 3: Set VITE_API_URL in Vercel (2 min)

```
Same dashboard as Action 2, click "Add New +"
  Name: VITE_API_URL
  Value: https://dogelinx-backend.onrender.com
  (use YOUR actual backend URL from Action 1)

Click "Save"
```

---

### Action 4: Redeploy Frontend (2 min)

```
https://vercel.com/dashboard
  → Your project
  → Deployments (tab)
  → Find latest deployment
  → Click "..." (three dots)
  → Click "Redeploy"

Wait ~2 minutes for "✓ Ready"
```

---

### Action 5: Test (2 min)

1. Go to your Vercel URL: `https://dogelinx-hueqqpbpi-dogeman2090-4746s-projects.vercel.app`
2. Hard refresh: **Ctrl+Shift+R** (must be SHIFT)
3. Try to download studio
4. ✅ Should work!

---

## If Still Not Working After All 5 Steps

**Do this diagnostic (1 min):**

Open browser DevTools (F12), go to Console, paste:

```javascript
(async () => {
  console.log('Testing...');
  try {
    const r = await fetch('https://dogelinx-backend.onrender.com/api/games');
    const d = await r.json();
    console.log('✅ Backend works:', d);
  } catch(e) {
    console.log('❌ Backend error:', e.message);
  }
  
  console.log('Frontend knows VITE_API_URL is:', import.meta.env.VITE_API_URL);
})()
```

**Report:**
- What does it say for each?
- Did you do all 5 actions above?
- Did you wait for Vercel redeploy to say "✓ Ready"?

---

## Deploy Backend (If Needed)

If Action 1 showed ❌ (no JSON response):

```
https://render.com/dashboard
  → "New +" → "Web Service"
  → Connect GitHub (select your repo)
  → Configure:

Build Command: cd backend && npm install
Start Command: npm start
Environment: Node

  → Create Web Service
  → Wait for "Live" status
  → Copy the URL back to Action 1
```

---

## 99% of the Time

The fix is:
1. Set `VITE_API_URL` in Vercel
2. Redeploy on Vercel
3. Hard refresh browser
4. Works ✅

Do that first!
