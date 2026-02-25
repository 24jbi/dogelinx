/**
 * Shared types and protocol definitions
 */

// WebSocket message types
export const WS_MESSAGES = {
  // Connection
  PLAYER_JOINED: 'player:joined',
  PLAYER_LEFT: 'player:left',
  
  // State sync
  PLAYER_UPDATE: 'player:update',
  GAME_STATE: 'game:state',
  
  // Actions
  PLAYER_ACTION: 'player:action',
  
  // Lifecycle
  PING: 'ping',
  PONG: 'pong',
  ERROR: 'error',
  DISCONNECT: 'disconnect'
};

// Player state validation
export const PlayerSchema = {
  id: 'string',
  username: 'string',
  position: { x: 'number', y: 'number', z: 'number' },
  rotation: { x: 'number', y: 'number', z: 'number' },
  avatar: 'object',
  timestamp: 'number'
};

// Game action types
export const ACTION_TYPES = {
  MOVE: 'move',
  JUMP: 'jump',
  CHAT: 'chat',
  EMOTION: 'emotion',
  EMOTE: 'emote'
};

// Rate limiting defaults
export const RATE_LIMITS = {
  PLAYER_UPDATE: 30, // updates per second per client
  CHAT: 5, // messages per second
  ACTION: 20 // actions per second
};

// Server config
export const SERVER_CONFIG = {
  PING_INTERVAL: 30000, // ms
  PING_TIMEOUT: 5000, // ms
  MAX_PLAYERS_PER_GAME: 50,
  MAX_INACTIVE_TIME: 120000 // ms
};

export default {
  WS_MESSAGES,
  PlayerSchema,
  ACTION_TYPES,
  RATE_LIMITS,
  SERVER_CONFIG
};
