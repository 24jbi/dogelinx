@echo off
REM DogeLinx Studio Desktop App Launcher
REM This script starts both the backend server and the Electron desktop app

echo.
echo ========================================
echo   DogeLinx Studio - Desktop App
echo ========================================
echo.

REM Check if Node is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo [INFO] Starting backend server on port 4000...
start "DogeLinx Backend" cmd /k "cd server && node index.js"

timeout /t 3 /nobreak

echo [INFO] Building and launching desktop app...
echo.

REM Run the desktop app
npm run electron:dev

pause
