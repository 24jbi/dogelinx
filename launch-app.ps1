# DogeLinx Studio Desktop App Launcher (PowerShell)
# This script starts both the backend server and the Electron desktop app

Write-Host ""
Write-Host "========================================"
Write-Host "  DogeLinx Studio - Desktop App" -ForegroundColor Cyan
Write-Host "========================================"
Write-Host ""

# Check if Node is installed
try {
    $nodeVersion = node --version
    Write-Host "[✓] Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[✗] Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "    Download from: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Start backend server
Write-Host ""
Write-Host "[INFO] Starting backend server on port 4000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "cd '$PSScriptRoot\server'; node index.js"

# Wait for server to start
Start-Sleep -Seconds 3

# Build and launch desktop app
Write-Host "[INFO] Building and launching desktop app..." -ForegroundColor Yellow
Write-Host ""

Set-Location $PSScriptRoot
npm run electron:dev
