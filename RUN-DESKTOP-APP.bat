@echo off
REM DogeLinx Studio - Complete Launcher with Server
REM This is the main launcher that does everything

setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo ============================================
echo    DogeLinx Studio Desktop App
echo ============================================
echo.

REM Check Node.js
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js not found!
    echo Please install from: https://nodejs.org/
    pause
    exit /b 1
)

echo [1/3] Starting backend server on port 4000...
start "DogeLinx Backend" cmd /k "cd /d "%~dp0server" && node index.js"

timeout /t 2 /nobreak

echo [2/3] Building app...
call npm run build >nul 2>nul

echo [3/3] Launching desktop app...
echo.

REM Launch Electron
npx electron .

pause
