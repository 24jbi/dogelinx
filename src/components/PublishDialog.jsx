import React, { useState, useEffect } from "react";
import { useStudio } from "../store.js";

export default function PublishDialog({ onClose, gameId: initialGameId, gameName: initialGameName }) {
  const [formData, setFormData] = useState({
    name: initialGameName || "",
    description: "",
  });
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isUpdate, setIsUpdate] = useState(!!initialGameId);
  const [gameId, setGameId] = useState(initialGameId || null);
  const [autoSaveStatus, setAutoSaveStatus] = useState(null);

  const exportJSON = useStudio((s) => s.exportJSON);

  useEffect(() => {
    // Set up auto-save if updating existing game
    if (isUpdate && gameId) {
      const autoSaveInterval = setInterval(() => {
        handleAutoSave();
      }, 30000); // Auto-save every 30 seconds
      
      return () => clearInterval(autoSaveInterval);
    }
  }, [isUpdate, gameId, formData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAutoSave = async () => {
    if (!isUpdate || !gameId) return;

    const currentUser = JSON.parse(localStorage.getItem("dogelinx_currentUser") || "null");
    if (!currentUser) return;

    try {
      const projectData = exportJSON();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

      const response = await fetch(`${apiUrl}/api/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name || "Untitled",
          desc: formData.description || "",
          id: gameId,
          projectData: JSON.stringify(projectData),
          username: currentUser.username,
          token: currentUser.token || "",
          isUpdate: true,
        }),
      });

      if (response.ok) {
        setAutoSaveStatus("✅ Auto-saved");
        setTimeout(() => setAutoSaveStatus(null), 2000);
      }
    } catch (err) {
      console.error("Auto-save error:", err);
    }
  };

  const handlePublish = async () => {
    if (!formData.name.trim()) {
      setError("Please enter a game name");
      return;
    }

    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem("dogelinx_currentUser") || "null");
    if (!currentUser) {
      setError("You must be logged in to publish games");
      return;
    }

    try {
      setPublishing(true);
      setError(null);

      // Get the project data
      const projectData = exportJSON();
      const publishGameId = gameId || `game_${Date.now()}`;
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

      // Publish to server
      const response = await fetch(`${apiUrl}/api/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          desc: formData.description,
          id: publishGameId,
          projectData: JSON.stringify(projectData),
          username: currentUser.username,
          token: currentUser.token || "",
          isUpdate: isUpdate,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to publish");
      }

      const data = await response.json();
      setGameId(data.entry.id);
      setIsUpdate(true);

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.message);
      console.error("Publish error:", err);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#1f2937",
          border: "1px solid #374151",
          borderRadius: "12px",
          padding: "24px",
          maxWidth: "500px",
          width: "90%",
          boxShadow: "0 20px 25px rgba(0, 0, 0, 0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            margin: "0 0 16px 0",
            color: "#f0fdf4",
            fontSize: "20px",
            fontWeight: "700",
          }}
        >
          {isUpdate ? "🔄 Update & Save Game" : "🚀 Publish Game"}
        </h2>

        {isUpdate && (
          <div
            style={{
              background: "#065f46",
              border: "1px solid #10b981",
              borderRadius: "6px",
              padding: "8px 12px",
              marginBottom: "16px",
              fontSize: "12px",
              color: "#d1fae5",
            }}
          >
            ✓ Editing game: <strong>{gameId}</strong>
            {autoSaveStatus && <div style={{ marginTop: "4px", fontSize: "11px" }}>{autoSaveStatus}</div>}
          </div>
        )}

        {!success ? (
          <>
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  color: "#cbd5e1",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Game Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter game name"
                disabled={publishing}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  background: "#111827",
                  border: "1px solid #374151",
                  borderRadius: "6px",
                  color: "#f0fdf4",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  opacity: publishing ? 0.6 : 1,
                  transition: "all 150ms ease",
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  color: "#cbd5e1",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Tell players about your game..."
                disabled={publishing}
                rows="4"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  background: "#111827",
                  border: "1px solid #374151",
                  borderRadius: "6px",
                  color: "#f0fdf4",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                  opacity: publishing ? 0.6 : 1,
                  transition: "all 150ms ease",
                  resize: "vertical",
                }}
              />
            </div>

            {error && (
              <div
                style={{
                  padding: "10px 12px",
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid #fca5a5",
                  borderRadius: "6px",
                  color: "#fca5a5",
                  fontSize: "13px",
                  marginBottom: "16px",
                }}
              >
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                onClick={onClose}
                disabled={publishing}
                style={{
                  padding: "8px 16px",
                  background: "#374151",
                  color: "#cbd5e1",
                  border: "1px solid #4b5563",
                  borderRadius: "6px",
                  cursor: publishing ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                  opacity: publishing ? 0.6 : 1,
                  transition: "all 150ms ease",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handlePublish}
                disabled={publishing}
                style={{
                  padding: "8px 16px",
                  background: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: publishing ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                  opacity: publishing ? 0.7 : 1,
                  transform: publishing ? "scale(0.98)" : "scale(1)",
                  transition: "all 150ms ease",
                }}
              >
                {publishing ? "Processing..." : isUpdate ? "Update" : "Publish"}
              </button>
            </div>
          </>
        ) : (
          <div
            style={{
              padding: "24px",
              textAlign: "center",
              color: "#4ade80",
            }}
          >
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>✅</div>
            <p style={{ margin: 0, fontSize: "16px", fontWeight: "600" }}>
              {isUpdate ? "Game Updated!" : "Game Published!"}
            </p>
            <p
              style={{
                margin: "8px 0 0 0",
                fontSize: "13px",
                color: "#cbd5e1",
              }}
            >
              {isUpdate ? "Your changes have been saved." : "Your game will be reviewed by moderators."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
