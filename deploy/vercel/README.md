# Vercel Deployment (Frontend Only)

Vercel is perfect for hosting the React frontend.

## Setup

1. Go to https://vercel.com
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure build settings:

### Build & Output Settings
- **Framework**: Vite
- **Build Command**: 
  ```
  npm install && npm --workspace=client run build
  ```
- **Output Directory**: 
  ```
  client/dist
  ```
- **Install Command**: 
  ```
  npm install
  ```

### Environment Variables
Set these in Vercel Dashboard → Settings → Environment Variables:

```
VITE_API_URL=https://dogelinx-backend.onrender.com
```

4. Click Deploy

## Auto-Deploy
Vercel automatically deploys when you push to `main` branch.

## Preview & Production
- Preview: Get URL from commit previews
- Production: Automatic when merged to main

## Domain
- Free `.vercel.app` subdomain provided
- Add custom domain in Settings

## Costs
- Free tier: Sufficient for most projects
- Pro tier: $20/mo for advanced analytics
