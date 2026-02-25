# Implementation Checklist & Testing Guide

## Pre-Launch Verification ✅

### Code Changes
- [x] New components created (GamesBrowser, GamePlayer, PublishDialog)
- [x] App.jsx routes updated (/games, /play/:gameId)
- [x] Landing.jsx enhanced with game features
- [x] Ribbon.jsx updated with publish button
- [x] Server endpoints added (GET /api/games, POST /api/publish, etc.)
- [x] Utility functions created (studioDownload.js)
- [x] Documentation created (GAME_PUBLISHING_GUIDE.md, CHANGELOG.md, QUICK_START.md)

### Dependencies
- [ ] Run `npm install` in workspace root
- [ ] Run `cd server && npm install && cd ..` to install server dependencies including archiver

### Server Configuration
- [ ] Verify `server/data/` directory exists or will be auto-created
- [ ] Verify `server/public/avatars/` directory exists
- [ ] Set DOGELINX_ADMIN environment variable (optional)

---

## Setup Steps

### 1. System Check
```bash
# Verify Node.js installed
node --version  # Should be v16+
npm --version   # Should be v8+
```

### 2. Install Dependencies
```bash
# Install main dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..
```

### 3. Start Services

#### Terminal 1 - Server
```bash
npm run server
# Or manually: cd server && npm start
# Should see: "DogeLinx server running on 4000"
```

#### Terminal 2 - Dev Server
```bash
npm run dev
# Should see: "Local: http://localhost:5173/"
```

### 4. Test in Browser
Open: `http://localhost:5173`

---

## Testing Plan

### 1. Navigation Testing
- [ ] Landing page loads (`/`)
- [ ] "🎮 Play Games" link works on header
- [ ] "🎮 Play Games" button works on hero section
- [ ] "📥 Download Studio" button is visible
- [ ] Can navigate to studio (`/studio`)
- [ ] Can navigate to avatar customizer (`/avatar`)

### 2. Games Library Testing
- [ ] Navigate to `/games`
- [ ] Page loads with "Play Games" title
- [ ] Empty state shows "No games published yet" (initially)
- [ ] Back button returns to landing page

### 3. Publishing Testing
```bash
# Step 1: Add test auth token
# In browser console:
localStorage.setItem('dogelinx_token', 'test-user-123')
```

```bash
# Step 2: Create a test game user
# GET http://localhost:4000/api/auth/signup?username=testuser&password=test123
# Or add manually to server/data/users.json:
```

- [ ] Navigate to studio (`/studio`)
- [ ] Build a simple game or load existing
- [ ] Click "🚀 Publish" button in Home tab
- [ ] Dialog appears with form
- [ ] Fill in game name and description
- [ ] Click "Publish"
- [ ] Success message appears

### 4. Server-Side Verification
```bash
# Check if game was saved
cat server/data/games.json  # Should contain your game

# Check game status
# Should show: "status": "pending"
```

### 5. Admin Approval
```bash
# In terminal or curl:
curl -X POST http://localhost:4000/api/moderation/approve \
  -H "Content-Type: application/json" \
  -d '{"index": 0, "key": "admin-secret"}'

# Or check server/data/games.json and manually change status to "approved"
```

### 6. Games Library Population
- [ ] Approved game now shows in `/games`
- [ ] Game card displays with name, author, description
- [ ] Play button is clickable

### 7. Game Player Testing
- [ ] Click "Play Now" on a game
- [ ] Navigate to `/play/[gameId]`
- [ ] Game attempts to load
- [ ] Playtest HUD appears (health bar)
- [ ] Back button works

### 8. Studio Download Testing
- [ ] Click "📥 Download Studio"
- [ ] Download dialog or flow appears
- [ ] Can select platform (Windows/Mac/Linux)
- [ ] Click to download
- [ ] ZIP file downloads successfully
- [ ] ZIP extracts contains necessary files

---

## Expected File Structure After Download

```
DogeLinx-Studio/
├── src/
│   ├── components/
│   │   ├── Layout.jsx
│   │   ├── SceneCanvas.jsx
│   │   ├── ... (all JSX components)
│   ├── utils/
│   │   ├── CommandParser.js
│   │   ├── ... (all utilities)
│   ├── styles/
│   │   ├── playtesting.css
│   ├── main.jsx
│   ├── App.jsx
│   ├── store.js
│   └── ... (all config files)
├── index.html
├── package.json
├── vite.config.mjs
├── README.md
└── ... (other config files)
```

---

## Database Files to Monitor

### `server/data/games.json`
Should contain published games:
```json
[
  {
    "id": "game_123456",
    "name": "Test Game",
    "desc": "My first game",
    "author": "testuser",
    "status": "pending",
    "projectData": "{...}",
    "createdAt": "2026-02-23T10:30:00Z"
  }
]
```

### `server/data/users.json`
Should contain user accounts:
```json
[
  {
    "username": "testuser",
    "password": "test123",
    "token": "test-user-123",
    "dogeTokens": 0,
    "createdAt": "2026-02-23T10:00:00Z"
  }
]
```

---

## Browser Console Debugging

### Check API Responses
```javascript
// Fetch games
fetch('/api/games').then(r => r.json()).then(d => console.log(d))

// Fetch specific game
fetch('/api/games/game_123456').then(r => r.json()).then(d => console.log(d))

// Check stored token
console.log('Token:', localStorage.getItem('dogelinx_token'))
```

### Test Project JSON Export
```javascript
// In studio
const json = window.dogelinxStore?.exportJSON?.()
console.log('Project JSON:', json)
```

---

## Common Issues & Solutions

### Issue: "Publish button not visible"
**Solution**: 
- Refresh browser
- Check if Ribbon component loaded
- Verify no console errors (F12)

### Issue: "Games not appearing in library"
**Solution**:
- Check `server/data/games.json` exists
- Verify game has `"status": "approved"`
- Refresh browser cache (Ctrl+Shift+Delete)
- Restart dev server

### Issue: "Download fails with 404"
**Solution**:
- Verify archiver installed: `npm list archiver`
- If not: `cd server && npm install archiver && cd ..`
- Check server logs for errors
- Verify root directory structure

### Issue: "Can't publish, form won't submit"
**Solution**:
- Check localStorage for token: `localStorage.getItem('dogelinx_token')`
- If empty, set one: `localStorage.setItem('dogelinx_token', 'user123')`
- Check console error (F12)
- Verify server is running (http://localhost:4000 should respond)

### Issue: "Port 5173 already in use"
**Solution**:
```bash
# Find process using port 5173
lsof -i :5173  # macOS/Linux
netstat -ano | findstr :5173  # Windows

# Kill the process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

---

## Performance Considerations

### Current Limitations
- Single-file JSON storage (not scalable)
- No API caching
- No CDN for downloads
- No request rate limiting

### Optimization Opportunities
1. Move to database (PostgreSQL, MongoDB)
2. Add Redis caching
3. Implement API pagination
4. Add zip file caching
5. Use CDN for zip downloads

---

## Security Checklist

### Before Production
- [ ] Change DOGELINX_ADMIN secret
- [ ] Implement JWT authentication
- [ ] Add input validation on all endpoints
- [ ] Enable HTTPS (use reverse proxy)
- [ ] Add rate limiting
- [ ] Implement CORS properly
- [ ] Add request size limits
- [ ] Sanitize project data
- [ ] Add password hashing (bcrypt)
- [ ] Implement API key system

### Current Vulnerabilities
⚠️ **WARNING**: This is a development version with security issues:
1. Passwords stored in plain text
2. Simple token system (not secure)
3. No input validation
4. No rate limiting
5. Minimal CORS configuration
6. Admin key in environment (not secure)

---

## Deployment Checklist

### Before Going Live
- [ ] Move data to database
- [ ] Implement proper authentication
- [ ] Set up SSL/HTTPS
- [ ] Configure production server
- [ ] Set up CDN for downloads
- [ ] Implement monitoring/logging
- [ ] Set up backups
- [ ] Create moderation interface
- [ ] Write admin documentation
- [ ] Plan capacity for scale

### Recommended Stack for Production
- **Frontend**: Vite + React (current)
- **Backend**: Node.js + Express (current) → consider Python/Go
- **Database**: PostgreSQL or MongoDB
- **Cache**: Redis
- **File Storage**: AWS S3 or similar
- **CDN**: CloudFront or Cloudflare
- **Hosting**: AWS, DigitalOcean, or similar
- **Monitoring**: Sentry, DataDog, or similar

---

## Feature Completeness

### ✅ Completed Features
- Game publishing pipeline
- Game browsing/discovery
- Game playback in browser
- Studio download generation
- Basic moderation system
- User authentication framework
- Project data persistence

### 🚀 Ready for Phase 2
- User profiles/dashboards
- Game ratings/reviews
- Advanced moderation UI
- Analytics dashboard
- Multiplayer gaming
- Asset marketplace
- Creator community tools

---

## Next Session Tasks

1. [ ] Test all features manually
2. [ ] Fix any bugs found
3. [ ] Add error handling
4. [ ] Implement database migration
5. [ ] Create admin dashboard UI
6. [ ] Add user profiles
7. [ ] Implement game versioning
8. [ ] Add analytics tracking

---

## Success Criteria

✅ All checkboxes completed = You're ready to launch!

- [ ] Can create and publish games
- [ ] Games appear in library after approval
- [ ] Can play games in browser
- [ ] Can download studio as ZIP
- [ ] No console errors
- [ ] Server handles requests correctly
- [ ] Download contains all necessary files
- [ ] Documentation is clear and complete

---

**Last Updated**: February 23, 2026  
**Maintainer**: DogeLinx Dev Team  
**Status**: Ready for Beta Testing 🚀
