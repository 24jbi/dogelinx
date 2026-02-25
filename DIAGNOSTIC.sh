#!/bin/bash
# or for PowerShell on Windows:

echo "🔍 COMPREHENSIVE DIAGNOSTIC - Run This NOW"
echo ""
echo "1️⃣ Testing Backend Connectivity"
echo "================================"

# Test Render backend
echo ""
echo "Testing: https://dogelinx-backend.onrender.com"
curl -v -X GET "https://dogelinx-backend.onrender.com/api/games" 2>&1 | head -30

echo ""
echo ""
echo "2️⃣ Testing Other Possible Backends"
echo "===================================="

echo "Testing Railway (old): https://veubc5rb.up.railway.app"
curl -v "https://veubc5rb.up.railway.app/api/games" 2>&1 | head -20

echo ""
echo "3️⃣ Check Vercel Environment Variables"
echo "======================================"
echo "Go to: https://vercel.com/dashboard"
echo "  → Your project"
echo "  → Settings"
echo "  → Environment Variables"
echo ""
echo "Should have:"
echo "  VITE_API_URL = https://dogelinx-backend.onrender.com"
echo ""

echo "4️⃣ Check Latest Vercel Deployment Build Logs"
echo "=============================================="
echo "Go to: https://vercel.com/dashboard"
echo "  → Deployments"
echo "  → Click latest"
echo "  → Logs tab"
echo "  Look for: VITE_API_URL in the environment"
