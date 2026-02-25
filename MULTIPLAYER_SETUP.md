# Multiplayer System Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
# Navigate to server directory
cd server

# Install new WebSocket dependency
npm install
```

### 2. Run the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Or production mode
npm start
```

The server will start on port 4000:
```
🎮 DogeLinx Multiplayer Server running on port 4000
```

### 3. Run the Frontend

In a new terminal:
```bash
# From project root
npm run dev
```

### 4. Test Multiplayer

1. Open the app: `http://localhost:5173`
2. Navigate to a game
3. The game will automatically connect to multiplayer
4. Open the same game in another browser tab
5. See players syncing in real-time!

## What's New

### Fixed Issues

✅ **Supabase Credentials**: `.env` file is configured with placeholders
- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with your credentials
- Or use local games without Supabase functionality

✅ **Server Connection Errors**: 
- Server now using HTTP upgrade for WebSocket
- All API endpoints working correctly

### New Multiplayer Features

🎮 **20-Player Sessions**: Each game can have multiple sessions with up to 20 players each

👥 **Real-Time Player Sync**:
- Position and rotation streaming
- Chat system
- Player join/leave notifications

⏰ **AFK Detection**:
- Automatically kicks players after 10 minutes of inactivity
- Keeps other players in the game
- Shows AFK warning in UI

📊 **Player List UI**:
- Real-time player count
- List of connected players
- Join time display
- Connection status indicator

## API Endpoints

### Get Session Info
```
GET /api/games/{gameId}/sessions
```

Response:
```json
{
  "ok": true,
  "gameId": "game_123",
  "sessions": [
    {
      "sessionId": "sess_abc",
      "playerCount": 3,
      "maxPlayers": 20,
      "isFull": false,
      "createdAt": 1708774800000,
      "players": [...]
    }
  ]
}
```

### Create/Join Session
```
POST /api/games/{gameId}/sessions
```

Request:
```json
{
  "username": "PlayerName"
}
```

Response:
```json
{
  "ok": true,
  "gameId": "game_123",
  "wsUrl": "ws://localhost:4000/ws/game/game_123",
  "username": "PlayerName"
}
```

## Configuration

### Server Settings (`server/multiplayer.js`)

```javascript
// Max players per session
const MAX_PLAYERS_PER_SESSION = 20;

// AFK timeout (milliseconds)
const AFK_TIMEOUT_MS = 10 * 60 * 1000;  // 10 minutes

// Heartbeat ping interval
const HEARTBEAT_INTERVAL = 30 * 1000;   // 30 seconds
```

### Adjust AFK Timeout

Change the timeout in `server/multiplayer.js`:

```javascript
// For 5 minute timeout
const AFK_TIMEOUT_MS = 5 * 60 * 1000;

// For 20 minute timeout
const AFK_TIMEOUT_MS = 20 * 60 * 1000;
```

## Troubleshooting

### Server won't start
```bash
# Check if port 4000 is in use
netstat -ano | findstr :4000

# Kill process using that port
taskkill /PID <PID> /F

# Try starting again
npm run dev
```

### Multiplayer not connecting
1. Check browser console for errors
2. Verify server is running on port 4000
3. Check firewall settings
4. Ensure `.env` has `VITE_API_URL=http://localhost:4000`

### Players not syncing
1. Check that position updates are being sent (browser console)
2. Verify WebSocket connection is established (DevTools Network tab)
3. Check server logs for errors

### Getting kicked for AFK
1. Make sure you're actively playing (sending input)
2. Position updates keep you active
3. Even idle players stay connected with 30-second heartbeat

## Testing Locally

### Multi-Tab Test
```
1. Open game in Tab A
2. Open same game in Tab B
3. See players syncing
4. Test chat/actions
5. Wait 10 minutes to see AFK kick
```

### Multi-Browser Test
```
1. Open game in Firefox
2. Open game in Chrome
3. Confirm cross-browser sync works
```

## Next Steps

1. **Integrate with Game Logic**:
   - Pass multiplayer data to scene components
   - Render other players in 3D scene
   - Sync game events

2. **Add Chat UI**: 
   - Display chat messages in-game
   - Input field for messages

3. **Implement Actions**:
   - Emotes (wave, dance, etc.)
   - Animations
   - Sound effects

4. **Scale for Production**:
   - Add Redis for session persistence
   - Load balancing for multiple servers
   - Database for game/user data

## Documentation

For detailed technical documentation, see [MULTIPLAYER_GUIDE.md](./MULTIPLAYER_GUIDE.md)

---

**All systems ready for multiplayer gaming! 🎮**
