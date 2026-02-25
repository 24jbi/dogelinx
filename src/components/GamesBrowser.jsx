import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function GamesBrowser() {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadGames = async () => {
      try {
        setLoading(true);
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
        const res = await fetch(`${apiUrl}/api/games`);
        if (!res.ok) throw new Error("Failed to load games");
        const data = await res.json();
        setGames(data.games || []);
      } catch (err) {
        setError(err.message);
        console.error("Error loading games:", err);
      } finally {
        setLoading(false);
      }
    };
    loadGames();
  }, []);

  const playGame = (gameId) => {
    navigate(`/play/${gameId}`);
  };

  return (
    <div className="dlx-games-browser">
      <style>{`
        .dlx-games-browser {
          min-height: 100vh;
          background: linear-gradient(135deg, #0b1220 0%, #1a2a4a 100%);
          color: #e5e7eb;
          padding: 40px 20px;
        }
        .games-container {
          max-width: 1200px;
          margin: 0 auto;
        }
        .games-header {
          text-align: center;
          margin-bottom: 60px;
        }
        .games-header h1 {
          font-size: clamp(32px, 5vw, 48px);
          font-weight: 900;
          color: #f0fdf4;
          margin: 0 0 12px 0;
        }
        .games-header p {
          font-size: 18px;
          color: #cbd5e1;
          margin: 0;
        }

        .games-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
          margin-bottom: 40px;
        }

        .game-card {
          background: rgba(31, 41, 55, 0.6);
          border: 1px solid #374151;
          border-radius: 12px;
          padding: 20px;
          cursor: pointer;
          transition: all 250ms ease;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .game-card:hover {
          background: rgba(55, 65, 81, 0.8);
          border-color: #60a5fa;
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(96, 165, 250, 0.2);
        }

        .game-cover {
          width: 100%;
          height: 160px;
          background: linear-gradient(135deg, #1e40af 0%, #0c4a6e 100%);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          color: rgba(255, 255, 255, 0.3);
        }

        .game-title {
          font-size: 18px;
          font-weight: 700;
          color: #f0fdf4;
          margin: 0;
        }
        .game-author {
          font-size: 13px;
          color: #9ca3af;
          margin: 0;
        }
        .game-desc {
          font-size: 14px;
          color: #cbd5e1;
          margin: 0;
          flex-grow: 1;
          line-height: 1.4;
        }

        .game-play-btn {
          background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 150ms ease;
        }
        .game-play-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(96, 165, 250, 0.4);
        }

        .games-loading,
        .games-error,
        .games-empty {
          text-align: center;
          padding: 60px 20px;
          font-size: 18px;
          color: #cbd5e1;
        }

        .games-error {
          color: #fca5a5;
        }

        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #60a5fa;
          text-decoration: none;
          font-weight: 600;
          margin-bottom: 24px;
          transition: all 150ms ease;
        }
        .back-btn:hover {
          gap: 12px;
        }
      `}</style>

      <button
        onClick={() => navigate("/")}
        className="back-btn"
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
      >
        ← Back to Home
      </button>

      <div className="games-container">
        <div className="games-header">
          <h1>Play Games</h1>
          <p>Discover and play games created on DogeLinx</p>
        </div>

        {loading && <div className="games-loading">Loading games...</div>}

        {error && <div className="games-error">Error: {error}</div>}

        {!loading && !error && games.length === 0 && (
          <div className="games-empty">
            <p>No games published yet. Be the first to create one!</p>
          </div>
        )}

        {!loading && !error && games.length > 0 && (
          <div className="games-grid">
            {games.map((game) => (
              <div key={game.id} className="game-card">
                <div className="game-cover">🎮</div>
                <h3 className="game-title">{game.name}</h3>
                <p className="game-author">by {game.author}</p>
                <p className="game-desc">{game.desc}</p>
                <button
                  className="game-play-btn"
                  onClick={() => playGame(game.id)}
                >
                  Play Now
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
