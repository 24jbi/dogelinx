import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useStudio } from "../store.js";
import SceneCanvas from "./SceneCanvas.jsx";
import PlaytestingSystem from "./PlaytestingSystem.jsx";
import MultiplayerUI from "./MultiplayerUI.jsx";
import MultiplayerClient from "../utils/MultiplayerClient.js";

export default function GamePlayer() {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [projectLoaded, setProjectLoaded] = useState(false);
  const [multiplayerClient, setMultiplayerClient] = useState(null);
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [username, setUsername] = useState(() => {
    const stored = localStorage.getItem('dogelinx_username');
    return stored || `Player${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  });

  const importJSON = useStudio((s) => s.importJSON);

  // Initialize multiplayer connection
  useEffect(() => {
    const initMultiplayer = async () => {
      try {
        const client = new MultiplayerClient(gameId, username);
        await client.connect();
        setMultiplayerClient(client);
        setIsMultiplayer(true);

        // Keep connection alive with periodic pings
        const pingInterval = setInterval(() => {
          if (client.isConnected()) {
            client.ping();
          }
        }, 30000);

        return () => {
          clearInterval(pingInterval);
          client.disconnect();
        };
      } catch (error) {
        console.error("Failed to connect to multiplayer:", error);
        setIsMultiplayer(false);
      }
    };

    if (projectLoaded) {
      initMultiplayer();
    }

    return () => {
      if (multiplayerClient) {
        multiplayerClient.disconnect();
      }
    };
  }, [gameId, username, projectLoaded]);

  useEffect(() => {
    const loadGame = async () => {
      try {
        setLoading(true);
        // Fetch game metadata
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
        const res = await fetch(`${apiUrl}/api/games/${gameId}`);
        if (!res.ok) throw new Error("Game not found");
        const data = await res.json();
        setGame(data.game);

        // Load the game project data
        if (data.game?.projectData) {
          const imported = importJSON(data.game.projectData);
          if (!imported) throw new Error("Failed to load game data");
          setProjectLoaded(true);
        }
      } catch (err) {
        setError(err.message);
        console.error("Error loading game:", err);
      } finally {
        setLoading(false);
      }
    };
    loadGame();
  }, [gameId, importJSON]);

  if (loading) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#0b1220",
        color: "#cbd5e1",
        fontSize: "18px",
      }}>
        Loading game...
      </div>
    );
  }

  if (error || !projectLoaded) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#0b1220",
        color: "#cbd5e1",
        gap: "20px",
      }}>
        <div style={{ fontSize: "18px", color: "#fca5a5" }}>
          {error ? `Error: ${error}` : "Failed to load game"}
        </div>
        <button
          onClick={() => navigate("/games")}
          style={{
            padding: "12px 24px",
            background: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          Back to Games
        </button>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{
        padding: "12px 16px",
        background: "rgba(11, 18, 32, 0.9)",
        borderBottom: "1px solid #374151",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <h2 style={{ margin: 0, color: "#f0fdf4", fontSize: "18px", fontWeight: "700" }}>
            {game?.name}
          </h2>
          {isMultiplayer && (
            <span style={{
              display: "inline-block",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#10b981",
              animation: "pulse 2s infinite"
            }} title="Multiplayer enabled" />
          )}
        </div>
        <button
          onClick={() => navigate("/games")}
          style={{
            padding: "8px 16px",
            background: "rgba(100, 116, 139, 0.2)",
            color: "#cbd5e1",
            border: "1px solid #60a5fa",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: "600",
            transition: "all 150ms ease",
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "rgba(100, 116, 139, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "rgba(100, 116, 139, 0.2)";
          }}
        >
          ← Back to Games
        </button>
      </div>

      {/* Game Canvas */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        <SceneCanvas />
        <PlaytestingSystem />
        <MultiplayerUI multiplayerClient={multiplayerClient} isMultiplayer={isMultiplayer} />
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
