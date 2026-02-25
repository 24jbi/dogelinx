# Render Deployment Instructions

1. Push code to GitHub
2. Go to https://render.com/dashboard
3. Click "New +" → "Web Service"
4. Connect GitHub repository
5. Use these settings:

## Backend Service
- **Repository**: Your repo
- **Branch**: main
- **Build Command**: 
  ```
  cd backend && npm install
  ```
- **Start Command**: 
  ```
  npm start
  ```
- **Environment**: Node
- **Instance Type**: Free (for testing) or Starter ($7+/mo for production)

## Environment Variables
```
NODE_ENV=production
LOG_LEVEL=info
PORT=4000
SUPABASE_URL=<your-supabase-url>
SUPABASE_ANON_KEY=<your-key>
```

## After Deployment
- Note the `.onrender.com` URL
- Add it to frontend's `VITE_API_URL`

## Costs
- Free tier: Limited, sleeps after 15m inactivity
- Starter: $7/mo minimum (always on)
- Premium: $25/mo (for scaling)
