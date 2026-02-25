# DogeLinx Multiplayer System

## Overview

The DogeLinx Multiplayer System enables up to 20 players to play together in real-time game sessions, similar to Roblox. The system includes automatic AFK detection that kicks players after 10 minutes of inactivity.

## Architecture

### Server-Side Components

#### 1. **Multiplayer Server** (`server/multiplayer.js`)
Core WebSocket server managing game sessions and players.

**Key Features:**
- WebSocket connection handling
- Game session management (max 20 players per session)
- Player state tracking
- Message broadcasting
- Automatic AFK detection and removal

**Main Classes:**

**`Player`** - Tracks individual player state
```javascript
new Player(playerId, username, sessionId)
// Properties: position, rotation, lastActivity, joinedAt
```

**`GameSession`** - Manages a single game session
```javascript
new GameSession(gameId)
// Methods: addPlayer(), removePlayer(), broadcast(), removeAFKPlayers()
```

**`MultiplayerServer`** - Main WebSocket server
```javascript
new MultiplayerServer(httpServer)
// Methods: handleConnection(), getSessionInfo(), broadcast()
```

#### 2. **Main Server** (`server/index.js`)
Express server with WebSocket integration and API endpoints.

**New Endpoints:**
- `GET /api/games/:gameId/sessions` - Get active sessions for a game
- `POST /api/games/:gameId/sessions` - Start a new multiplayer session
- `ws://localhost:4000/ws/game/:gameId` - WebSocket connection for gameplay

### Client-Side Components

#### 1. **MultiplayerClient** (`src/utils/MultiplayerClient.js`)
Client-side WebSocket manager for connection and communication.

**Key Methods:**
```javascript
const client = new MultiplayerClient(gameId, username);

await client.connect();                    // Connect to multiplayer server
client.sendPositionUpdate(position);       // Send player position
client.sendRotationUpdate(rotation);       // Send player rotation
client.sendChat(text);                     // Send chat message
client.sendAction(action, data);           // Send player action
client.getPlayers();                       // Get list of all players
client.getPlayer(playerId);                // Get specific player
client.disconnect();                       // Disconnect gracefully
```

#### 2. **MultiplayerUI** (`src/components/MultiplayerUI.jsx`)
React component displaying multiplayer information.

**Features:**
- Real-time player list
- Session information
- AFK warning notification
- Connection status
- Player count tracking

#### 3. **GamePlayer** (`src/components/GamePlayer.jsx`)
Updated to integrate multiplayer functionality.

**New Features:**
- Automatic multiplayer connection on game load
- Username persistence in localStorage
- Periodic ping to keep connection alive
- Multiplayer UI display

## Configuration

### Environment Variables

No additional environment variables required. The system uses existing Supabase configuration.

**`.env` file:**
```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:4000
```

### Server Configuration

Edit constants in `server/multiplayer.js`:
```javascript
const MAX_PLAYERS_PER_SESSION = 20;      // Max players per game session
const AFK_TIMEOUT_MS = 10 * 60 * 1000;   // 10 minute AFK timeout
const HEARTBEAT_INTERVAL = 30 * 1000;    // 30 second ping interval
```

## WebSocket Protocol

### Message Types

**Client → Server:**

1. **Position Update**
```json
{
  "type": "position-update",
  "position": { "x": 0, "y": 5, "z": 10 }
}
```

2. **Rotation Update**
```json
{
  "type": "rotation-update",
  "rotation": { "x": 0, "y": 90, "z": 0 }
}
```

3. **Chat Message**
```json
{
  "type": "chat",
  "text": "Hello world!"
}
```

4. **Player Action**
```json
{
  "type": "action",
  "action": "emote:wave",
  "data": {}
}
```

5. **Ping (Keep-Alive)**
```json
{
  "type": "ping"
}
```

**Server → Client:**

1. **Welcome (On Connect)**
```json
{
  "type": "welcome",
  "playerId": "abc123",
  "username": "Player",
  "sessionId": "sess_xyz",
  "gameId": "game_123",
  "maxPlayers": 20,
  "players": [...]
}
```

2. **Player Joined**
```json
{
  "type": "player-joined",
  "playerId": "newplayer123",
  "username": "NewPlayer",
  "players": [...]
}
```

3. **Position/Rotation Update**
```json
{
  "type": "position-update",
  "playerId": "player123",
  "position": { "x": 0, "y": 5, "z": 10 }
}
```

4. **Chat Message**
```json
{
  "type": "chat",
  "playerId": "player123",
  "username": "Player",
  "text": "Hello!",
  "timestamp": 1234567890
}
```

5. **Player Action**
```json
{
  "type": "player-action",
  "playerId": "player123",
  "action": "emote:wave",
  "data": {}
}
```

6. **Player Left**
```json
{
  "type": "player-left",
  "playerId": "leftplayer123",
  "username": "LeftPlayer",
  "players": [...]
}
```

7. **Kicked (AFK Timeout)**
```json
{
  "type": "kicked",
  "reason": "AFK timeout",
  "message": "You were kicked for being AFK too long (10 minutes)"
}
```

## AFK System

### How It Works

1. **Activity Tracking**: Every time a player sends a message (position, rotation, chat, action), their `lastActivity` timestamp is updated.

2. **AFK Detection**: The server checks every 60 seconds if any player's `lastActivity` is older than 10 minutes.

3. **Removal**: Players identified as AFK are:
   - Notified with a "kicked" message
   - Disconnected from the server
   - Removed from the session

4. **Client Handling**: The client displays an AFK warning notification for 5 seconds.

### Message to Keep Connection Alive

The client automatically sends a "ping" message every 30 seconds to:
- Keep the connection alive through firewalls/proxies
- Update the player's activity timestamp (preventing AFK kicks while idle)
- Maintain heartbeat

## Deployment

### Local Development

```bash
# Install dependencies
cd server
npm install

# Run development server
npm run dev

# In another terminal
npm run dev  # from project root for frontend
```

### Production

1. **Server Updates**: Deploy updated `server/index.js` and `server/multiplayer.js`
2. **Client Updates**: Build and deploy updated React components
3. **No Database Changes**: Uses in-memory session storage (persists during server uptime)

**Note:** Sessions are lost on server restart. For production, consider adding Redis-backed session persistence.

## Integration with Game Components

### Using Multiplayer in Custom Components

```javascript
import React, { useEffect } from 'react';

export function MyGameComponent({ multiplayerClient }) {
  useEffect(() => {
    if (!multiplayerClient) return;

    // Listen for player actions
    multiplayerClient.on('player-action', (message) => {
      console.log(`Player ${message.playerId} did: ${message.action}`);
    });

    // Send your player's position
    const updatePosition = () => {
      multiplayerClient.sendPositionUpdate({
        x: Math.random() * 100,
        y: 5,
        z: Math.random() * 100
      });
    };

    const interval = setInterval(updatePosition, 100);
    return () => clearInterval(interval);
  }, [multiplayerClient]);

  return <div>Game Component</div>;
}
```

## Troubleshooting

### Connection Issues

**Problem**: `net::ERR_CONNECTION_REFUSED`
- **Solution**: Ensure server is running (`npm run dev` in server directory)

**Problem**: WebSocket connection fails
- **Solution**: Check CORS settings, ensure port 4000 is accessible

### AFK Kicks

**Problem**: Players getting kicked while playing
- **Solution**: Ensure player actions send messages to the server (position updates, etc.)

**Problem**: Players not getting kicked when AFK
- **Solution**: Check server logs, ensure AFK monitor is running

### Session Management

**Problem**: "All sessions full" error
- **Solution**: Server creates new sessions automatically; wait a moment and try again

**Problem**: Player list not updating
- **Solution**: Refresh page, check network tab for WebSocket messages

## Future Enhancements

1. **Redis Session Persistence** - Survive server restarts
2. **Chat History** - Store and display previous messages
3. **Player Animations** - Sync animations between players
4. **Voice Chat** - Add audio communication (WebRTC)
5. **Admin Controls** - Kick/ban players, manage sessions
6. **Matchmaking** - Automatic player grouping
7. **Spectator Mode** - Watch ongoing games
8. **Session Recording** - Record gameplay for later playback
9. **Cross-Server Play** - Multiple server instances
10. **Anti-Cheat** - Validate player actions server-side

## References

- **WebSocket API**: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
- **Express Server**: https://expressjs.com
- **Node.js ws Library**: https://github.com/websockets/ws

---

**Last Updated**: February 24, 2026
**Version**: 1.0.0
