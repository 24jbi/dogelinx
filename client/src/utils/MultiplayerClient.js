/**
 * MultiplayerClient - Client-side WebSocket manager for multiplayer games
 */
import { API_BASE_URL } from './apiClient';

class MultiplayerClient {
  constructor(gameId, username = null) {
    this.gameId = gameId;
    this.username = username;
    this.playerId = null;
    this.sessionId = null;
    this.ws = null;
    this.connected = false;
    this.players = new Map(); // playerId -> player data
    this.messageHandlers = new Map(); // messageType -> [callbacks]
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
  }

  /**
   * Connect to the multiplayer server
   */
  async connect() {
    try {
      // Get WebSocket URL from API
      const response = await fetch(`${API_BASE_URL}/api/games/${this.gameId}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: this.username })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.error);
      }

      const data = await response.json();
      const wsUrl = `${data.wsUrl}?username=${encodeURIComponent(this.username || 'Player')}`;

      return new Promise((resolve, reject) => {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.connected = true;
          this.reconnectAttempts = 0;
          console.log('Connected to multiplayer server');
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(JSON.parse(event.data));
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          this.connected = false;
          console.log('Disconnected from multiplayer server');
          this.attemptReconnect();
        };

        setTimeout(() => {
          if (!this.connected) {
            reject(new Error('Connection timeout'));
          }
        }, 5000);
      });
    } catch (error) {
      console.error('Failed to connect:', error);
      throw error;
    }
  }

  /**
   * Handle incoming messages from server
   */
  handleMessage(message) {
    switch (message.type) {
      case 'welcome':
        this.playerId = message.playerId;
        this.sessionId = message.sessionId;
        this.players = new Map();
        message.players.forEach(p => {
          this.players.set(p.id, p);
        });
        break;

      case 'player-joined':
        message.players.forEach(p => {
          this.players.set(p.id, p);
        });
        break;

      case 'player-left':
        message.players.forEach(p => {
          this.players.set(p.id, p);
        });
        break;

      case 'kicked':
        console.warn(`Kicked from game: ${message.message}`);
        break;
    }

    // Call registered handlers
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(callback => {
        try {
          callback(message);
        } catch (error) {
          console.error('Error in message handler:', error);
        }
      });
    }
  }

  /**
   * Register a callback for a message type
   */
  on(messageType, callback) {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, []);
    }
    this.messageHandlers.get(messageType).push(callback);
  }

  /**
   * Send position update to server
   */
  sendPositionUpdate(position) {
    if (this.connected && this.ws) {
      this.ws.send(JSON.stringify({
        type: 'position-update',
        position
      }));
    }
  }

  /**
   * Send rotation update to server
   */
  sendRotationUpdate(rotation) {
    if (this.connected && this.ws) {
      this.ws.send(JSON.stringify({
        type: 'rotation-update',
        rotation
      }));
    }
  }

  /**
   * Send chat message
   */
  sendChat(text) {
    if (this.connected && this.ws) {
      this.ws.send(JSON.stringify({
        type: 'chat',
        text
      }));
    }
  }

  /**
   * Send a player action (emote, animation, etc.)
   */
  sendAction(action, data = {}) {
    if (this.connected && this.ws) {
      this.ws.send(JSON.stringify({
        type: 'action',
        action,
        data
      }));
    }
  }

  /**
   * Send ping to keep connection alive
   */
  ping() {
    if (this.connected && this.ws) {
      this.ws.send(JSON.stringify({ type: 'ping' }));
    }
  }

  /**
   * Get list of current players
   */
  getPlayers() {
    return Array.from(this.players.values());
  }

  /**
   * Get a specific player
   */
  getPlayer(playerId) {
    return this.players.get(playerId);
  }

  /**
   * Get current player count
   */
  getPlayerCount() {
    return this.players.size;
  }

  /**
   * Attempt to reconnect
   */
  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... (attempt ${this.reconnectAttempts})`);
      setTimeout(() => {
        this.connect().catch(error => {
          console.error('Reconnection failed:', error);
        });
      }, this.reconnectDelay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.ws) {
      this.connected = false;
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.connected && this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

export default MultiplayerClient;
