import React, { useState, useEffect } from "react";

/**
 * MultiplayerUI - Shows player list, status, and multiplayer info
 */
export default function MultiplayerUI({ multiplayerClient, isMultiplayer }) {
  const [players, setPlayers] = useState([]);
  const [afkWarning, setAfkWarning] = useState(false);
  const [sessionInfo, setSessionInfo] = useState(null);

  useEffect(() => {
    if (!isMultiplayer || !multiplayerClient) return;

    const updatePlayerList = (message) => {
      setPlayers(multiplayerClient.getPlayers());
    };

    const handleKicked = (message) => {
      setAfkWarning(true);
      setTimeout(() => {
        setAfkWarning(false);
      }, 5000);
    };

    // Register message handlers
    multiplayerClient.on("welcome", updatePlayerList);
    multiplayerClient.on("player-joined", updatePlayerList);
    multiplayerClient.on("player-left", updatePlayerList);
    multiplayerClient.on("kicked", handleKicked);

    // Update session info
    setSessionInfo({
      playerId: multiplayerClient.playerId,
      sessionId: multiplayerClient.sessionId,
      playerCount: multiplayerClient.getPlayerCount(),
      maxPlayers: 20
    });

    // Update player list periodically
    const interval = setInterval(() => {
      setPlayers([...multiplayerClient.getPlayers()]);
      setSessionInfo(prev => prev ? {
        ...prev,
        playerCount: multiplayerClient.getPlayerCount()
      } : null);
    }, 1000);

    return () => clearInterval(interval);
  }, [isMultiplayer, multiplayerClient]);

  if (!isMultiplayer) return null;

  return (
    <div style={{
      position: "fixed",
      top: "80px",
      right: "16px",
      background: "rgba(15, 23, 42, 0.95)",
      border: "1px solid #374151",
      borderRadius: "8px",
      padding: "12px",
      maxWidth: "300px",
      zIndex: 1000,
      color: "#cbd5e1",
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "12px"
    }}>
      {/* AFK Warning */}
      {afkWarning && (
        <div style={{
          background: "#7f1d1d",
          color: "#fca5a5",
          padding: "8px",
          borderRadius: "4px",
          marginBottom: "8px",
          border: "1px solid #dc2626",
          animation: "pulse 1s infinite"
        }}>
          ⚠️ You were kicked for being AFK
        </div>
      )}

      {/* Session Info */}
      {sessionInfo && (
        <div style={{ marginBottom: "12px", paddingBottom: "8px", borderBottom: "1px solid #374151" }}>
          <div style={{ fontWeight: "600", marginBottom: "4px" }}>Session</div>
          <div style={{ fontSize: "11px", color: "#94a3b8" }}>
            Players: {sessionInfo.playerCount}/{sessionInfo.maxPlayers}
          </div>
          <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
            ID: {sessionInfo.sessionId?.slice(0, 8)}...
          </div>
        </div>
      )}

      {/* Player List */}
      <div>
        <div style={{ fontWeight: "600", marginBottom: "8px" }}>
          Players ({players.length})
        </div>
        <div style={{ maxHeight: "200px", overflowY: "auto" }}>
          {players.map((player) => (
            <div
              key={player.id}
              style={{
                padding: "6px",
                background: "rgba(100, 116, 139, 0.1)",
                marginBottom: "4px",
                borderRadius: "4px",
                borderLeft: player.id === multiplayerClient?.playerId ? "2px solid #60a5fa" : "2px solid #374151"
              }}
            >
              <div style={{
                fontSize: "11px",
                fontWeight: player.id === multiplayerClient?.playerId ? "600" : "400"
              }}>
                {player.username}
                {player.id === multiplayerClient?.playerId && " (You)"}
              </div>
              <div style={{
                fontSize: "10px",
                color: "#64748b",
                marginTop: "2px"
              }}>
                Joined: {new Date(player.joinedAt).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Multiplayer Info */}
      <div style={{
        marginTop: "12px",
        paddingTop: "8px",
        borderTop: "1px solid #374151",
        fontSize: "11px",
        color: "#94a3b8"
      }}>
        <div style={{ marginBottom: "4px" }}>
          ✓ Connected to multiplayer
        </div>
        <div>
          🎮 Max 20 players per session
        </div>
        <div style={{ marginTop: "4px", color: "#67e8f9" }}>
          💤 AFK timeout: 10 minutes
        </div>
      </div>
    </div>
  );
}
