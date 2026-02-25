# DigitalOcean App Platform Deployment

DigitalOcean offers clear, predictable pricing with reliable service.

## Setup

1. Go to https://cloud.digitalocean.com/apps
2. Click "Create App"
3. Connect GitHub repository
4. Choose `app.yaml` from this folder
5. Review settings and deploy

## Pricing
- Basic app: ~$5-12/mo
- Database: ~$15/mo for PostgreSQL
- Total: ~$20-27/mo for small project

## Benefits
- Predictable pricing (no surprise charges)
- Included Spaces object storage
- Built-in monitoring
- Simple CI/CD

## Backend Configuration

Service Type: Web Service
Build Phase: `cd backend && npm install`
Run Command: `npm start`
HTTP Port: 4000

Environment Variables:
- NODE_ENV: production
- LOG_LEVEL: info
- SUPABASE_URL: <your-url>
- SUPABASE_ANON_KEY: <your-key>

## Scale Up
When you outgrow the basic tier:
1. DigitalOcean → App Settings → Upgrade Plan
2. Add more instances for load balancing
3. Consider managed database

## Resources
- Docs: https://docs.digitalocean.com/products/app-platform/
- Pricing: https://www.digitalocean.com/pricing/app-platform
