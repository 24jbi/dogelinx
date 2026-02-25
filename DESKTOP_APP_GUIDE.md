# 🚀 DogeLinx Studio - Desktop App Setup Guide

## Quick Start - Run the Desktop App

### Option 1: Using Batch File (Windows)
Double-click one of these in the folder:
- **`launch-app.bat`** - Simple batch launcher
- **`launch-app.ps1`** - PowerShell launcher (more detailed)

### Option 2: Using Terminal Commands

#### PowerShell
```powershell
cd D:\dogelinx
npm run electron:dev
```

#### Command Prompt (cmd)
```cmd
cd D:\dogelinx
npm run electron:dev
```

---

## What Each Command Does

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start web version on http://localhost:5174 |
| `npm run electron` | Run Electron with already-built files |
| `npm run electron:dev` | Build + run Electron (recommended) |
| `npm run start` | Run web dev server + Electron together |
| `npm run build` | Build web version for production |
| `npm run dist` | Create Windows installer (.exe) |

---

## Manual Setup Steps

If you want to run everything manually:

### Terminal 1 - Backend Server
```powershell
cd D:\dogelinx\server
node index.js
# Should show: "DogeLinx server running on 4000"
```

### Terminal 2 - Desktop App
```powershell
cd D:\dogelinx
npm run electron:dev
```

The Electron app will:
1. ✅ Build the web version
2. ✅ Launch as a desktop window
3. ✅ Connect to backend on port 4000
4. ✅ Give you full desktop app experience

---

## Current System Status

✅ **Node.js**: Installed  
✅ **Electron**: v40.6.0 installed  
✅ **Backend Server**: Running on port 4000  
✅ **Web Dev** (optional): Running on port 5174  

---

## Desktop App Features

Once running, you get:
- 🖥️ Native Windows desktop window
- 📁 File system integration
- 💾 Save/load projects from Documents/DogeLinx/Projects
- 🎮 Full studio access
- 🎨 Build games offline
- 🚀 Publish to platform when connected
- 💻 Better performance than browser

---

## Troubleshooting

### "Command not found" Error
**Solution**: Make sure you're in the workspace directory
```powershell
cd D:\dogelinx
npm run electron:dev
```

### App won't start
**Solution**: Kill any existing processes and try again
```powershell
# If Electron is stuck:
Get-Process electron | Stop-Process -Force

# Then try again:
npm run electron:dev
```

### Backend not connecting
**Solution**: Make sure server is running on port 4000
```powershell
# Terminal 1:
cd D:\dogelinx\server
node index.js

# Terminal 2:
npm run electron:dev
```

### Port 4000 already in use
**Solution**: Kill the process using port 4000
```powershell
# Find and kill process on port 4000
Get-NetTCPConnection -LocalPort 4000 | Stop-Process -Force
```

---

## Create Windows Installer

To create a standalone `.exe` installer:

```powershell
npm run dist
```

This will create:
- `dist/DogeLinx Studio Setup 0.1.0.exe` - Full installer
- `dist/DogeLinx Studio 0.1.0.exe` - Portable version

Users can then:
1. Download the `.exe`
2. Double-click to install
3. Launch from Start Menu or Desktop shortcut

---

## File Structure

```
D:\dogelinx\
├── launch-app.bat         ← Double-click to run (Windows)
├── launch-app.ps1         ← PowerShell launcher
├── electron-main.js       ← Desktop app entry point
├── package.json           ← Project config
├── vite.config.js         ← Build config
├── src/                   ← React components
├── server/                ← Backend API
│   ├── index.js
│   └── package.json
└── dist/                  ← Built app output (after npm run build)
```

---

## Next Steps

1. **Run the app**:
   ```powershell
   npm run electron:dev
   ```

2. **Create and publish games**

3. **Build installer** (when ready):
   ```powershell
   npm run dist
   ```

4. **Share the `.exe`** with users

---

## Keyboard Shortcuts (In App)

- **F12** - Open Developer Tools
- **Ctrl+Shift+I** - Open Inspector
- **F5** - Refresh
- **Ctrl+R** - Reload
- **Ctrl+Q** - Quit app

---

## System Requirements

- **OS**: Windows 7+
- **RAM**: 2GB minimum
- **Storage**: 500MB
- **Internet**: For publishing/downloading

---

**Version**: 0.1.0  
**Status**: Ready to launch ✅  
**Last Updated**: February 24, 2026
