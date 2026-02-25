const WebSocket = require('ws');
const { nanoid } = require('nanoid');
const http = require('http');

// Configuration
const MAX_PLAYERS_PER_SESSION = 20;
const AFK_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const HEARTBEAT_INTERVAL = 30 * 1000; // 30 seconds
const PING_TIMEOUT_MS = 5000; // 5 seconds

// Rate limiting configuration
const RATE_LIMITS = {
  POSITION_UPDATE: { maxPerSecond: 30, window: 1000 },
  CHAT: { maxPerSecond: 5, window: 1000 },
  ACTION: { maxPerSecond: 20, window: 1000 }
};

// Validation utility
const validatePosition = (pos) => {
  if (!pos || typeof pos !== 'object') return false;
  return typeof pos.x === 'number' && typeof pos.y === 'number' && typeof pos.z === 'number' &&
    Math.abs(pos.x) < 100000 && Math.abs(pos.y) < 100000 && Math.abs(pos.z) < 100000;
};

const validateRotation = (rot) => {
  if (!rot || typeof rot !== 'object') return false;
  return typeof rot.x === 'number' && typeof rot.y === 'number' && typeof rot.z === 'number';
};

/**
 * RateLimiter for per-connection rate limiting
 */
class RateLimiter {
  constructor(limits = RATE_LIMITS) {
    this.limits = limits;
    this.buckets = new Map();
  }

  check(type) {
    if (!this.limits[type]) return true;
    
    const limit = this.limits[type];
    const now = Date.now();
    
    if (!this.buckets.has(type)) {
      this.buckets.set(type, { count: 0, resetTime: now + limit.window });
    }
    
    const bucket = this.buckets.get(type);
    if (now > bucket.resetTime) {
      bucket.count = 0;
      bucket.resetTime = now + limit.window;
    }
    
    bucket.count++;
    return bucket.count <= limit.maxPerSecond;
  }
}

/**
 * Player class to track individual player state
 */
class Player {
  constructor(id, username, sessionId) {
    this.id = id;
    this.username = username;
    this.sessionId = sessionId;
    this.position = { x: 0, y: 0, z: 0 };
    this.rotation = { x: 0, y: 0, z: 0 };
    this.lastActivity = Date.now();
    this.joinedAt = Date.now();
    this.rateLimiter = new RateLimiter();
    this.isPingWaiting = false;
    this.lastPongTime = Date.now();
  }

  updateActivity() {
    this.lastActivity = Date.now();
  }

  isAFK(timeout = AFK_TIMEOUT_MS) {
    return Date.now() - this.lastActivity > timeout;
  }

  updateLastPong() {
    this.lastPongTime = Date.now();
    this.isPingWaiting = false;
  }
}

/**
 * GameSession class to manage individual game sessions
 */
class GameSession {
  constructor(gameId) {
    this.gameId = gameId;
    this.sessionId = nanoid();
    this.players = new Map(); // playerId -> Player
    this.createdAt = Date.now();
    this.isFull = () => this.players.size >= MAX_PLAYERS_PER_SESSION;
  }

  addPlayer(player) {
    if (this.isFull()) {
      throw new Error('Session is full');
    }
    this.players.set(player.id, player);
    return player;
  }

  removePlayer(playerId) {
    this.players.delete(playerId);
  }

  getPlayer(playerId) {
    return this.players.get(playerId);
  }

  getPlayerList() {
    return Array.from(this.players.values()).map(p => ({
      id: p.id,
      username: p.username,
      position: p.position,
      rotation: p.rotation,
      joinedAt: p.joinedAt
    }));
  }

  broadcast(message, excludePlayerId = null) {
    this.players.forEach((player, playerId) => {
      if (playerId !== excludePlayerId && player.ws && player.ws.readyState === WebSocket.OPEN) {
        try {
          player.ws.send(JSON.stringify(message));
        } catch (error) {
          console.error('Error broadcasting to player:', error);
        }
      }
    });
  }

  removeAFKPlayers() {
    const afkPlayers = [];
    this.players.forEach((player, playerId) => {
      if (player.isAFK()) {
        afkPlayers.push(playerId);
        if (player.ws && player.ws.readyState === WebSocket.OPEN) {
          player.ws.send(JSON.stringify({
            type: 'kicked',
            reason: 'AFK timeout',
            message: 'You were kicked for being AFK too long (10 minutes)'
          }));
          player.ws.close(4000, 'AFK timeout');
        }
        this.removePlayer(playerId);
      }
    });
    return afkPlayers;
  }

  isEmpty() {
    return this.players.size === 0;
  }
}

/**
 * MultiplayerServer class to manage all game sessions and WebSocket connections
 */
class MultiplayerServer {
  constructor(httpServer) {
    this.wss = new WebSocket.Server({ noServer: true });
    this.sessions = new Map(); // gameId -> GameSession[]
    this.playerToSession = new Map(); // playerId -> { gameId, sessionId }
    
    // Handle WebSocket upgrades
    httpServer.on('upgrade', (request, socket, head) => {
      if (request.url.startsWith('/ws/game/')) {
        this.wss.handleUpgrade(request, socket, head, (ws) => {
          this.handleConnection(ws, request);
        });
      } else {
        socket.destroy();
      }
    });

    // Start AFK check interval
    this.startAFKMonitor();
  }

  handleConnection(ws, request) {
    try {
      const url = new URL(request.url, `http://${request.headers.host}`);
      const gameId = url.pathname.split('/')[3]; // /ws/game/{gameId}
      const username = url.searchParams.get('username') || `Player${nanoid(6).toUpperCase()}`;
      
      if (!gameId) {
        ws.close(4000, 'Invalid game ID');
        return;
      }

      const playerId = nanoid();
      const player = new Player(playerId, username, null);
      player.ws = ws;

      // Find or create a session for this game
      let session = this.findAvailableSession(gameId);
      if (!session) {
        session = new GameSession(gameId);
        if (!this.sessions.has(gameId)) {
          this.sessions.set(gameId, []);
        }
        this.sessions.get(gameId).push(session);
      }

      try {
        session.addPlayer(player);
        player.sessionId = session.sessionId;
        this.playerToSession.set(playerId, { gameId, sessionId: session.sessionId });

        // Send welcome message
        ws.send(JSON.stringify({
          type: 'welcome',
          playerId,
          username,
          sessionId: session.sessionId,
          gameId,
          maxPlayers: MAX_PLAYERS_PER_SESSION,
          players: session.getPlayerList()
        }));

        // Notify other players
        session.broadcast({
          type: 'player-joined',
          playerId,
          username,
          players: session.getPlayerList()
        }, playerId);

        // Handle incoming messages
        ws.on('message', (data) => {
          this.handleMessage(playerId, data, session);
        });

        // Handle disconnect
        ws.on('close', () => {
          this.handleDisconnect(playerId, session);
        });

        ws.on('error', (error) => {
          console.error('WebSocket error:', error);
        });
      } catch (error) {
        ws.send(JSON.stringify({
          type: 'error',
          message: error.message
        }));
        ws.close(4001, error.message);
      }
    } catch (error) {
      console.error('Connection error:', error);
      ws.close(4000, 'Connection error');
    }
  }

  handleMessage(playerId, data, session) {
    try {
      const message = JSON.parse(data);
      const player = session.getPlayer(playerId);
      
      if (!player) return;

      // Update activity
      player.updateActivity();

      // Handle pong response
      if (message.type === 'pong') {
        player.updateLastPong();
        return;
      }

      // Check rate limits for most types
      if (!['ping', 'pong'].includes(message.type)) {
        if (!player.rateLimiter.check(message.type)) {
          player.ws.send(JSON.stringify({
            type: 'error',
            message: 'Rate limit exceeded',
            code: 'RATE_LIMIT'
          }));
          return;
        }
      }

      switch (message.type) {
        case 'position-update':
          if (validatePosition(message.position)) {
            player.position = message.position;
            session.broadcast({
              type: 'position-update',
              playerId,
              position: player.position,
              timestamp: Date.now()
            }, playerId);
          } else {
            player.ws.send(JSON.stringify({
              type: 'error',
              message: 'Invalid position data'
            }));
          }
          break;

        case 'rotation-update':
          if (validateRotation(message.rotation)) {
            player.rotation = message.rotation;
            session.broadcast({
              type: 'rotation-update',
              playerId,
              rotation: player.rotation,
              timestamp: Date.now()
            }, playerId);
          } else {
            player.ws.send(JSON.stringify({
              type: 'error',
              message: 'Invalid rotation data'
            }));
          }
          break;

        case 'chat':
          if (message.text && typeof message.text === 'string' && message.text.length < 500) {
            session.broadcast({
              type: 'chat',
              playerId,
              username: player.username,
              text: message.text.substring(0, 500),
              timestamp: Date.now()
            });
          }
          break;

        case 'action':
          if (message.action && typeof message.action === 'string') {
            session.broadcast({
              type: 'player-action',
              playerId,
              action: message.action,
              data: message.data || {},
              timestamp: Date.now()
            });
          }
          break;

        case 'ping':
          player.ws.send(JSON.stringify({ type: 'pong' }));
          break;

        default:
          console.log(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('Message handling error:', error);
    }
  }

  handleDisconnect(playerId, session) {
    const player = session.getPlayer(playerId);
    if (player) {
      session.removePlayer(playerId);
      this.playerToSession.delete(playerId);

      // Notify others
      session.broadcast({
        type: 'player-left',
        playerId,
        username: player.username,
        players: session.getPlayerList()
      });

      // Clean up empty sessions
      if (session.isEmpty()) {
        const gameId = session.gameId;
        const gameSessions = this.sessions.get(gameId);
        if (gameSessions) {
          const index = gameSessions.indexOf(session);
          if (index !== -1) {
            gameSessions.splice(index, 1);
          }
          if (gameSessions.length === 0) {
            this.sessions.delete(gameId);
          }
        }
      }
    }
  }

  findAvailableSession(gameId) {
    const gameSessions = this.sessions.get(gameId);
    if (!gameSessions || gameSessions.length === 0) return null;
    
    for (const session of gameSessions) {
      if (!session.isFull()) {
        return session;
      }
    }
    return null;
  }

  startAFKMonitor() {
    // AFK check every minute
    setInterval(() => {
      this.sessions.forEach((gameSessions, gameId) => {
        gameSessions.forEach((session) => {
          const afkPlayers = session.removeAFKPlayers();
          if (afkPlayers.length > 0) {
            console.log(`Removed ${afkPlayers.length} AFK players from game ${gameId}`);
          }
        });
      });
    }, 60000);

    // Heartbeat - send ping every 30 seconds
    setInterval(() => {
      this.sessions.forEach((gameSessions, gameId) => {
        gameSessions.forEach((session) => {
          session.players.forEach((player, playerId) => {
            if (player.ws && player.ws.readyState === WebSocket.OPEN) {
              // Check if we're still waiting for a pong from the last ping
              if (player.isPingWaiting && Date.now() - player.lastPongTime > PING_TIMEOUT_MS) {
                console.log(`Player ${playerId} ping timeout`);
                player.ws.close(4000, 'Ping timeout');
                session.removePlayer(playerId);
              } else {
                // Send new ping
                player.isPingWaiting = true;
                player.ws.send(JSON.stringify({ type: 'ping' }));
              }
            }
          });
        });
      });
    }, HEARTBEAT_INTERVAL);
  }

  getSessionInfo(gameId) {
    const gameSessions = this.sessions.get(gameId);
    if (!gameSessions) return null;
    
    return gameSessions.map(session => ({
      sessionId: session.sessionId,
      playerCount: session.players.size,
      maxPlayers: MAX_PLAYERS_PER_SESSION,
      isFull: session.isFull(),
      createdAt: session.createdAt,
      players: session.getPlayerList()
    }));
  }

  broadcast(gameId, message, excludePlayerId = null) {
    const gameSessions = this.sessions.get(gameId);
    if (gameSessions) {
      gameSessions.forEach(session => {
        session.broadcast(message, excludePlayerId);
      });
    }
  }
}

module.exports = { 
  MultiplayerServer, 
  GameSession, 
  Player, 
  RateLimiter,
  MAX_PLAYERS_PER_SESSION, 
  AFK_TIMEOUT_MS,
  PING_TIMEOUT_MS,
  RATE_LIMITS
};
