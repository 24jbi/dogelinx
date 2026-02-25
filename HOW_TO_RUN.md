# 🎮 DogeLinx Studio - How to Run the Desktop App

## Easiest Way - Click a File! 

### Option 1: Windows Batch (Simplest) ⭐
**Double-click this file in your folder:**
```
RUN-DESKTOP-APP.bat
```

It will:
1. Start the backend server
2. Build the app
3. Launch as a desktop window
4. Done! 🎉

### Option 2: PowerShell Script
**Right-click → Open with PowerShell:**
```
launch-app.ps1
```

Or in PowerShell:
```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
.\launch-app.ps1
```

---

## More Options

### Run in Terminal (PowerShell)
```powershell
cd D:\dogelinx
npm run electron:dev
```

### Run with Web Development (Hot Reload)
Open 2 terminals:

**Terminal 1 - Backend:**
```powershell
cd D:\dogelinx\server
node index.js
```

**Terminal 2 - Desktop App:**
```powershell
cd D:\dogelinx
npm start
```

---

## What Happens When You Launch

1. ✅ Backend server starts (port 4000)
2. ✅ App builds for desktop
3. ✅ Electron window opens
4. ✅ Full desktop experience
5. ✅ Can create/publish games
6. ✅ Can play community games
7. ✅ Can download studio

---

## Features You Get

| Feature | Web | Desktop |
|---------|-----|---------|
| Create games | ✅ | ✅ |
| Publish games | ✅ | ✅ |
| Play games | ✅ | ✅ |
| Save locally | ✅ | ✅ Better |
| Offline mode | ❌ | ✅ |
| Native window | ❌ | ✅ |
| File integration | ❌ | ✅ |
| Faster | ❌ | ✅ |

---

## File Locations

**Project files saved to:**
```
C:\Users\{YourUsername}\Documents\DogeLinx\Projects
```

**Backend data saved to:**
```
D:\dogelinx\server\data\
```

---

## Troubleshooting

### App won't start
- Make sure backend is running (port 4000)
- Check that Node.js is installed
- Try: `npm install` in workspace

### Port already in use
```powershell
# Kill process on port 4000
Get-NetTCPConnection -LocalPort 4000 | Stop-Process -Force

# Then try launching again
```

### Need to see debug info
- Press **F12** to open dev tools
- Check console for errors

---

## Create a Shareable Installer

When you're ready to share:
```powershell
npm run dist
```

This creates:
- `DogeLinx Studio Setup 0.1.0.exe` - Installer for others
- Users can double-click it and it installs automatically

---

## Web Version (Still Available)

You can still use the web version:
```
http://localhost:5174
```

Just run:
```powershell
npm run dev
```

---

## System Requirements

- Windows 7 or newer
- 2GB RAM
- 500MB free space
- Node.js installed

---

## Getting Help

- Check [DESKTOP_APP_GUIDE.md](DESKTOP_APP_GUIDE.md) for full guide
- Check [QUICK_START.md](QUICK_START.md) for game creation guide
- Check console (F12) for errors

---

## Summary

### To Run Desktop App:
```
Double-click: RUN-DESKTOP-APP.bat
```

### That's it! 🎉

The app will:
- ✅ Start backend
- ✅ Build and launch
- ✅ Open in desktop window
- ✅ Work offline
- ✅ Save games locally

---

**Ready to create games?** Let's go! 🚀

See [QUICK_START.md](QUICK_START.md) for how to create and publish your first game.
