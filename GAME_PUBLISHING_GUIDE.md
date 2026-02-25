# DogeLinx Studio - Game Publishing & Playing Guide

## New Features Implemented

This update adds complete game publishing and playing capabilities to DogeLinx Studio!

### 1. 🎮 **Play Games** - Browse and Play Community Games
- **Location**: `/games` route or "Play Games" button on landing page
- **Features**:
  - Browse all approved published games
  - Play games directly in the browser
  - Game card displays with title, author, description
  - One-click play functionality

### 2. 🚀 **Publish Games** - Share Your Creations
- **How to Publish**:
  1. Build your game in the studio
  2. Click the purple "🚀 Publish" button in the Home tab of the Ribbon
  3. Fill in the game name and description
  4. Submit for review
  5. Game appears on the platform after approval

- **What Gets Saved**:
  - Complete project data (terrain, objects, scripts, etc.)
  - Game metadata (name, description, author)
  - Automatic versioning and timestamps

### 3. 📥 **Download Studio** - Get the Desktop Version
- **Options**:
  - Launch web version directly (no download needed)
  - Download minimal studio bundle (just the studio, not all files)
  - Download for Windows, macOS, or Linux

- **Download Size**: ~50MB (much smaller than full Electron app)
- **What's Included**:
  - All components (editor, inspector, hierarchy, etc.)
  - Terrain generator and utility functions
  - Configuration files
  - Setup instructions

### 4. 🎯 **Game Player** - Browser-Based Game Engine
- **Automatic Loading**: Games load from published snapshots
- **Playtest UI**: Health bar and game stats while playing
- **Browser Native**: No installation required to play

## Architecture Overview

```
DogeLinx Studio
├── Web Studio (/studio)
│   └── Publish Button → PublishDialog → Server API
├── Games Library (/games)
│   ├── GamesBrowser - Lists all approved games
│   └── GamePlayer (/play/:gameId) - Plays selected game
├── Landing Page (/)
│   ├── Play Games Button
│   ├── Download Studio Button
│   └── Launch Studio Button
└── Server (node + express)
    ├── GET /api/games - List approved games
    ├── GET /api/games/:id - Get specific game data
    ├── POST /api/publish - Submit game for approval
    └── POST /api/download-studio - Download studio as ZIP
```

## Setup Instructions

### 1. Install Server Dependencies
```bash
cd server
npm install
cd ..
```

### 2. Start the Server
```bash
npm run server  # or: cd server && npm start
```

### 3. Start Development Vite Server
```bash
npm run dev
```

### 4. Access the Platform
- Web Studio: `http://localhost:5173/studio`
- Games Library: `http://localhost:5173/games`
- Landing Page: `http://localhost:5173`

## File Structure

### New Components
- `src/components/GamesBrowser.jsx` - Browse published games
- `src/components/GamePlayer.jsx` - Game player interface
- `src/components/PublishDialog.jsx` - Publish game modal

### New Utilities
- `src/utils/studioDownload.js` - Studio download functionality

### Updated Components
- `src/App.jsx` - New routes for games and player
- `src/components/Landing.jsx` - Updated with game features
- `src/components/Ribbon.jsx` - Added publish button

### Server Updates
- `server/index.js` - New API endpoints
- `server/package.json` - Added archiver dependency

## API Endpoints

### GET `/api/games`
Returns array of all approved games.
```json
{
  "ok": true,
  "games": [
    {
      "id": "game_123456",
      "name": "My Awesome Game",
      "desc": "A fun game to play",
      "author": "username",
      "status": "approved",
      "createdAt": "2026-02-23T10:30:00Z"
    }
  ]
}
```

### GET `/api/games/:id`
Get a specific game by ID.
```json
{
  "ok": true,
  "game": {
    "id": "game_123456",
    "name": "My Awesome Game",
    "desc": "A fun game to play",
    "author": "username",
    "projectData": "{ ... full project JSON ... }",
    "status": "approved",
    "createdAt": "2026-02-23T10:30:00Z"
  }
}
```

### POST `/api/publish`
Publish a new game (requires authentication).
```json
{
  "name": "My Game",
  "desc": "Game description",
  "id": "game_123456",
  "projectData": "{ ... }",
  "token": "user_token"
}
```

Response:
```json
{
  "ok": true,
  "entry": {
    "id": "game_123456",
    "name": "My Game",
    "status": "pending",
    "author": "username"
  }
}
```

### POST `/api/download-studio`
Download studio as ZIP file.
- Returns: ZIP file with studio source code
- Size: ~50MB
- Includes: All components, utilities, config files, and setup instructions

## Future Enhancements

1. **Game Ratings & Reviews**
   - Star rating system
   - Community comments
   - Most played list

2. **Developer Dashboard**
   - Game analytics
   - Download stats
   - Player feedback

3. **Multiplayer Support**
   - Network synchronization
   - Real-time game sessions
   - Leaderboards

4. **Advanced Publishing**
   - Game previews/trailers
   - Thumbnail uploads
   - Version management

5. **Moderation Tools**
   - Better approval system
   - Game reporting
   - Content guidelines

## Troubleshooting

### Games Not Showing Up
- Check if server is running: `npm run server`
- Verify games are approved in moderation panel
- Clear browser cache

### Download Fails
- Enable ZIP support on server
- Check available disk space
- Verify Node packages installed: `npm install`

### Publish Button Missing
- Refresh the studio page
- Check console for errors
- Verify Ribbon component loaded

### Player Won't Load
- Check game data in server/data/games.json
- Verify projectData is valid JSON
- Check browser console for parsing errors

## Development Tips

1. **Test Publishing Locally**:
   ```javascript
   // In browser console
   localStorage.setItem('dogelinx_token', 'test-token');
   ```

2. **View Game Data**:
   - Check `server/data/games.json` for published games
   - View pending games in moderation panel

3. **Debug Game Loading**:
   - Open DevTools
   - Check Network tab for API calls
   - Verify game project data in Console

4. **Monitor Server**:
   - Check Node console for request logs
   - Monitor `server/data/` directory

## Security Notes

- Game data stored in JSON files (use database for production)
- Authentication uses simple token system (implement JWT for production)
- Admin moderation key in environment variable
- Consider adding rate limiting and input validation

---

**Version**: 0.1.0  
**Last Updated**: February 23, 2026  
**Made with ❤️ for DogeLinx Creators**
