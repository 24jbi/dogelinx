# DogeLinx Vercel Deployment Guide

## Production Deployment Issues Fixed

### ✅ Issues Resolved

1. **CSP Blob URL Blocking** - Updated `index.html` CSP to allow `blob:` URLs
2. **API Routing** - Created Vercel serverless API proxy at `/api/` 
3. **Environment Configuration** - Updated `vercel.json` to use environment variables

## Deployment Options

### Option 1: Vercel Frontend + Separate Backend Server (Recommended)

**Setup:**
1. Deploy frontend to Vercel
2. Deploy backend to a separate Node.js hosting service (Heroku, Render, Railway, etc.)
3. Set backend URL in Vercel environment variables

**Vercel Configuration:**
```bash
vercel env add VITE_API_URL https://your-backend.com
```

**Backend Deployment Options:**
- **Heroku**: `npm run build && git push heroku main`
- **Render**: Connect GitHub repo, set build command to `npm install && npm run dev`
- **Railway**: Connect GitHub, select Node.js as language
- **DigitalOcean App Platform**: Create app from GitHub
- **AWS Elastic Beanstalk**: Deploy with `eb deploy`

### Option 2: Vercel Edge Functions + Backend (Self-Hosted)

If you want to run the backend on your own VPS/server:

1. Deploy backend to your server (VPS, DigitalOcean, etc.)
2. Add the backend URL to Vercel environment:
   ```bash
   vercel env add VITE_API_URL https://your-server.com:4000
   ```

### Option 3: Local Development

For development, the API proxy will forward requests to `http://localhost:4000`:

```bash
# Terminal 1: Start backend
cd server
npm run dev

# Terminal 2: Start frontend dev server
npm run dev

# Access at http://localhost:5173
```

## Environment Setup on Vercel

### Dashboard Configuration

1. Go to your Vercel project settings
2. Navigate to **Settings → Environment Variables**
3. Add variable:
   - **Name**: `VITE_API_URL`
   - **Value**: Your backend server URL (e.g., `https://api.example.com`)
   - **Select**: Production, Preview, Development

### Command Line Setup

```bash
# Add production backend URL
vercel env add production VITE_API_URL https://your-backend.com

# Add preview backend URL (for staging)
vercel env add preview VITE_API_URL https://staging-backend.com

# Add development backend URL (local)
vercel env add development VITE_API_URL http://localhost:4000
```

## API Proxy Details

The Vercel serverless function at `api/[...api].js` handles:

- ✅ All HTTP methods (GET, POST, PUT, DELETE, etc.)
- ✅ Request/response streaming for large files
- ✅ CORS headers for cross-origin requests
- ✅ Timeout handling (30 seconds default)
- ✅ Error responses with proper status codes
- ✅ X-Forwarded headers for backend logging

### How It Works

```
Client Request
    ↓
https://dogelinx.vercel.app/api/games
    ↓
Vercel Function (api/[...api].js)
    ↓
Forward to Backend (https://api.example.com/api/games)
    ↓
Response piped back to client
```

## Testing the Deployment

### Check API Connectivity

```bash
# Frontend console:
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
fetch(`${apiUrl}/api/games`).then(r => r.json()).then(console.log);
```

### Verify Environment Variables

```bash
# Check what's deployed
vercel env list
```

## Common Issues & Solutions

### Issue: 503 Service Unavailable
**Cause**: Backend server is not reachable  
**Solution**: 
- Verify backend URL is correct
- Ensure backend is running and publicly accessible
- Check firewall rules allow HTTPS on port 443

### Issue: 504 Gateway Timeout
**Cause**: Backend took too long to respond  
**Solution**:
- Increase timeout in `api/[...api].js`
- Optimize backend endpoints
- Check backend performance

### Issue: CORS Errors
**Cause**: Backend not accepting requests from Vercel domain  
**Solution**:
- Ensure backend has CORS enabled
- Update CORS origins to include your Vercel domain
- Backend should allow `https://your-app.vercel.app`

### Issue: 405 Method Not Allowed
**Cause**: Backend endpoint doesn't support the HTTP method  
**Solution**:
- Verify endpoint exists on backend
- Check request method (GET vs POST)
- Review backend route definitions

## Production Checklist

- [ ] Backend deployed and running
- [ ] Backend URL added to Vercel environment variables
- [ ] CSP allows blob: and https: for textures
- [ ] API proxy configured in `api/[...api].js`
- [ ] CORS enabled on backend
- [ ] Environment variables set for Production, Preview, Development
- [ ] Test games load and can be published
- [ ] Test multiplayer connections work
- [ ] Check server logs for errors
- [ ] Monitor Vercel analytics dashboard

## Scaling Considerations

### For High Traffic:

1. **Backend**: Use load balancer (AWS ALB, CloudFlare)
2. **Database**: Switch from file-based to PostgreSQL/MongoDB
3. **CDN**: Enable Vercel's automatic CDN for assets
4. **Caching**: Add request caching headers
5. **Monitoring**: Set up error tracking (Sentry)

### Recommended Hosting Stack:

```
Frontend:     Vercel (automatic deployments)
Backend:      Render.com or Railway (auto-scaling)
Database:     PostgreSQL (managed)
CDN:          Cloudflare (free tier available)
Monitoring:   Vercel + Sentry
```

## Deployment Commands

```bash
# Deploy to Vercel
vercel deploy --prod

# Set environment variable
vercel env add production VITE_API_URL https://api.example.com

# View logs
vercel logs

# View environment variables
vercel env list

# Remove app
vercel remove
```

## Documentation Links

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel Serverless Functions](https://vercel.com/docs/concepts/functions/serverless-functions)
- [Vercel Deployment Docs](https://vercel.com/docs/concepts/deployments/overview)
- [Node.js Runtime](https://vercel.com/docs/concepts/functions/serverless-functions/runtimes/node-js)

---

**Status**: ✅ Production Ready  
**Last Updated**: February 24, 2026  
**Version**: 1.0.0
