import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DownloadFlow from "./DownloadFlow.jsx";
import { downloadStudio } from "../utils/studioDownload.js";
import { API_BASE_URL } from "../utils/apiClient.js";

export default function Landing() {
  const navigate = useNavigate();
  const [showDownloadFlow, setShowDownloadFlow] = useState(false);
  const [downloadingStudio, setDownloadingStudio] = useState(false);
  const [downloadError, setDownloadError] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("signin"); // "signin" or "signup"
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  // Check if user is logged in on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("dogeuser");
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem("dogeuser");
      }
    }
  }, []);

  // Handle authentication (signup/signin)
  const handleAuth = useCallback(async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setAuthError("Username and password required");
      return;
    }
    
    try {
      setAuthLoading(true);
      setAuthError(null);
      
      const endpoint = authMode === "signin" ? "/api/auth/signin" : "/api/auth/signup";
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await res.json();
      
      if (!data.ok) {
        setAuthError(data.error || "Authentication failed");
        return;
      }
      
      // Store user in localStorage
      localStorage.setItem("dogeuser", JSON.stringify(data.user));
      setCurrentUser(data.user);
      setUsername("");
      setPassword("");
      setShowAuthModal(false);
    } catch (err) {
      setAuthError(err.message || "Network error");
      console.error("Auth error:", err);
    } finally {
      setAuthLoading(false);
    }
  }, [authMode, username, password]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("dogeuser");
    setCurrentUser(null);
  }, []);

  const handleLaunchStudio = useCallback(() => {
    if (!currentUser) {
      setShowAuthModal(true);
      setAuthMode("signin");
      return;
    }
    // Studio is only available in the desktop app
    alert("Studio is only available in the desktop app. Please download DogeLinx Studio to create games.");
  }, [currentUser]);

  const openDownload = useCallback(() => setShowDownloadFlow(true), []);
  const closeDownload = useCallback(() => setShowDownloadFlow(false), []);
  const handleDownloadStudio = useCallback(async () => {
    try {
      setDownloadingStudio(true);
      setDownloadError(null);
      await downloadStudio();
    } catch (err) {
      const errorMsg = err.message || "Unknown error occurred";
      console.error("Download failed:", err);
      setDownloadError(errorMsg);
    } finally {
      setDownloadingStudio(false);
    }
  }, []);

  // Smooth anchor scrolling
  useEffect(() => {
    const onClick = (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute("href")?.slice(1);
      const el = id ? document.getElementById(id) : null;
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return (
    <div className="dlx-landing">
      <style>{`
        .dlx-landing {
          min-height: 100vh;
          background: linear-gradient(135deg, #0b1220 0%, #1a2a4a 100%);
          color: #e5e7eb;
        }
        .dlx-wrap { max-width: 1200px; margin: 0 auto; }

        .dlx-header {
          padding: 20px 40px;
          border-bottom: 1px solid #374151;
          position: sticky;
          top: 0;
          backdrop-filter: blur(10px);
          background: rgba(11, 18, 32, 0.75);
          z-index: 50;
        }
        .dlx-headerRow {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }
        .dlx-brand {
          font-size: 24px;
          font-weight: 900;
          color: #60a5fa;
          white-space: nowrap;
        }
        .dlx-nav {
          display: flex;
          gap: 24px;
          font-size: 14px;
          flex-wrap: wrap;
          justify-content: flex-end;
          pointer-events: auto;
        }
        .dlx-link {
          color: #cbd5e1;
          text-decoration: none;
          opacity: 0.9;
          pointer-events: auto;
          cursor: pointer;
        }
        .dlx-link:hover { opacity: 1; color: #f0fdf4; }

        .dlx-hero {
          padding: 80px 40px;
          text-align: center;
        }
        .dlx-hero h1 {
          font-size: clamp(38px, 6vw, 56px);
          font-weight: 900;
          margin: 0 0 16px 0;
          color: #f0fdf4;
        }
        .dlx-hero p {
          font-size: 20px;
          color: #cbd5e1;
          margin: 0 auto 32px auto;
          max-width: 860px;
          line-height: 1.6;
        }

        .dlx-ctaRow {
          display: flex;
          gap: 18px;
          justify-content: center;
          flex-wrap: wrap;
          margin-top: 32px;
          pointer-events: auto;
        }
        .dlx-btn {
          padding: 20px 48px;
          font-size: 18px;
          font-weight: 900;
          border-radius: 16px;
          cursor: pointer;
          transition: transform 150ms ease, box-shadow 150ms ease, background 150ms ease, border-color 150ms ease;
          pointer-events: auto;
          position: relative;
          z-index: 10;
          border: none;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .dlx-btnPrimary {
          background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
          color: white;
          box-shadow: 0 8px 24px rgba(96, 165, 250, 0.45);
          min-width: 220px;
        }
        .dlx-btnPrimary:hover {
          transform: translateY(-3px);
          box-shadow: 0 14px 32px rgba(96, 165, 250, 0.65);
        }
        .dlx-btnGhost {
          background: rgba(20, 184, 166, 0.2);
          color: #14b8a6;
          border: 2px solid #14b8a6;
          pointer-events: auto;
          font-weight: 900;
          min-width: 200px;
        }
        .dlx-btnGhost:hover {
          background: rgba(20, 184, 166, 0.35);
          color: #f0fdf4;
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(20, 184, 166, 0.4);
        }
        .dlx-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          pointer-events: none;
        }

        .dlx-section {
          padding: 80px 40px;
        }
        .dlx-sectionAlt {
          background: rgba(15, 18, 25, 0.5);
          border-top: 1px solid rgba(55, 65, 81, 0.35);
          border-bottom: 1px solid rgba(55, 65, 81, 0.35);
        }
        .dlx-section h2 {
          font-size: 40px;
          font-weight: 900;
          margin: 0 0 40px 0;
          text-align: center;
        }

        .dlx-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 18px;
        }
        .dlx-card {
          padding: 26px;
          background: rgba(31, 41, 55, 0.6);
          border: 1px solid #374151;
          border-radius: 16px;
          transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
        }
        .dlx-card:hover {
          background: rgba(31, 41, 55, 0.9);
          border-color: #60a5fa;
          transform: translateY(-4px);
        }
        .dlx-cardIcon { font-size: 40px; margin-bottom: 14px; }
        .dlx-cardTitle { font-size: 18px; font-weight: 900; margin: 0 0 8px 0; color: #f0fdf4; }
        .dlx-cardDesc { margin: 0; color: #9ca3af; font-size: 14px; line-height: 1.6; }

        .dlx-downloadBtn {
          width: 100%;
          padding: 26px;
          background: rgba(31, 41, 55, 0.6);
          border: 1px solid #374151;
          border-radius: 16px;
          color: inherit;
          cursor: pointer;
          transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }
        .dlx-downloadBtn:hover {
          background: rgba(31, 41, 55, 0.9);
          border-color: #14b8a6;
          transform: translateY(-4px);
        }
        .dlx-pill {
          margin-top: 10px;
          padding: 8px 16px;
          background: #14b8a6;
          color: #0b1220;
          border-radius: 10px;
          font-weight: 900;
          font-size: 12px;
        }
        .dlx-version { font-size: 11px; color: #64748b; margin-top: 8px; }

        .dlx-footer {
          padding: 40px;
          border-top: 1px solid #374151;
          text-align: center;
          color: #64748b;
        }
      `}</style>

      {/* Header */}
      <header className="dlx-header">
        <div className="dlx-wrap dlx-headerRow">
          <button
            onClick={handleLaunchStudio}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "0",
              transition: "opacity 150ms ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.8"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
            title="Launch Studio"
          >
            <img
              src="/dogelinx-icon.JPG"
              alt="DogeLinx Logo"
              style={{
                height: "32px",
                width: "32px",
                objectFit: "contain",
                borderRadius: "4px",
              }}
            />
            <span className="dlx-brand" style={{ margin: "0", fontSize: "20px" }}>DogeLinx Studio</span>
          </button>
          <nav className="dlx-nav">
            <a className="dlx-link" href="#features">Features</a>
            <button
              onClick={() => navigate("/games")}
              style={{
                background: "none",
                border: "none",
                color: "#cbd5e1",
                cursor: "pointer",
                fontSize: "14px",
                opacity: 0.9,
                transition: "all 0.2s",
                padding: "4px 8px",
              }}
              onMouseEnter={(e) => { e.target.style.color = "#f0fdf4"; e.target.style.opacity = "1"; }}
              onMouseLeave={(e) => { e.target.style.color = "#cbd5e1"; e.target.style.opacity = "0.9"; }}
            >
              🎮 Play Games
            </button>
            <button
              onClick={() => navigate("/avatar")}
              style={{
                background: "none",
                border: "none",
                color: "#cbd5e1",
                cursor: "pointer",
                fontSize: "14px",
                opacity: 0.9,
                transition: "all 0.2s",
                padding: "4px 8px",
              }}
              onMouseEnter={(e) => { e.target.style.color = "#f0fdf4"; e.target.style.opacity = "1"; }}
              onMouseLeave={(e) => { e.target.style.color = "#cbd5e1"; e.target.style.opacity = "0.9"; }}
            >
              👤 Avatar Shop
            </button>
            <a className="dlx-link" href="#download">Download</a>
            <a className="dlx-link" href="https://github.com/username/dogelinx" target="_blank" rel="noreferrer">
              GitHub
            </a>
            {currentUser ? (
              <>
                <span style={{ color: "#cbd5e1", fontSize: "14px", opacity: 0.8 }}>
                  👋 {currentUser.username}
                </span>
                <button
                  onClick={handleLogout}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#fca5a5",
                    cursor: "pointer",
                    fontSize: "14px",
                    opacity: 0.9,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => { e.target.opacity = "1"; }}
                  onMouseLeave={(e) => { e.target.opacity = "0.9"; }}
                >
                  Log Out
                </button>
              </>
            ) : (
              <button
                onClick={() => { setShowAuthModal(true); setAuthMode("signin"); }}
                style={{
                  background: "#60a5fa",
                  border: "none",
                  color: "white",
                  padding: "6px 16px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "700",
                  opacity: 0.9,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => { e.target.opacity = "1"; }}
                onMouseLeave={(e) => { e.target.opacity = "0.9"; }}
              >
                Sign In
              </button>
            )}
        </div>
      </header>

      {/* Hero */}
      <section className="dlx-hero dlx-wrap">
        <h1>Create Amazing Games</h1>
        <p>
          DogeLinx Studio is a Roblox-like platform where you can build, create, and share interactive 3D worlds.
        </p>

        <div className="dlx-ctaRow">
          <button className="dlx-btn dlx-btnPrimary" onClick={handleLaunchStudio}>
            🚀 Launch Studio (Web)
          </button>
          <button className="dlx-btn dlx-btnGhost" onClick={handleDownloadStudio} disabled={downloadingStudio}>
            📥 {downloadingStudio ? "Downloading..." : "Download Studio"}
          </button>
          <button 
            className="dlx-btn dlx-btnGhost" 
            onClick={() => navigate("/games")}
            style={{ borderColor: "#14b8a6" }}
          >
            🎮 Play Games
          </button>
        </div>

        {downloadError && (
          <div style={{
            marginTop: "16px",
            padding: "12px 16px",
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid #fca5a5",
            borderRadius: "8px",
            color: "#fca5a5",
            fontSize: "14px",
            textAlign: "left",
            maxWidth: "500px",
            margin: "16px auto 0 auto",
            lineHeight: "1.6",
          }}>
            <strong>⚠️ Download Failed:</strong> {downloadError}
            <div style={{ fontSize: "12px", marginTop: "8px", opacity: 0.9 }}>
              <div>Try:</div>
              <ul style={{ margin: "4px 0", paddingLeft: "20px" }}>
                <li>Refresh the page (Ctrl+Shift+R)</li>
                <li>Make sure backend is deployed to Render.com</li>
                <li>Set VITE_API_URL in Vercel settings</li>
                <li>Redeploy from Vercel dashboard</li>
              </ul>
              See <code style={{ fontSize: "11px" }}>DIAGNOSTIC_CHECKLIST.md</code> in repo
            </div>
          </div>
        )}
      </section>

      {/* Features */}
      <section id="features" className="dlx-section dlx-sectionAlt">
        <div className="dlx-wrap">
          <h2>Powerful Features</h2>
          <div className="dlx-grid">
            {[
              { icon: "🎨", title: "Visual Builder", desc: "Intuitive drag-and-drop interface for creating 3D scenes" },
              { icon: "🌍", title: "Terrain System", desc: "Heightmap-based terrain with brush tools for natural landscapes" },
              { icon: "💻", title: "Scripting", desc: "Write Lua scripts to add interactivity and game logic" },
              { icon: "🤖", title: "AI & Avatars", desc: "Build NPCs and character systems with AI behaviors" },
              { icon: "📦", title: "Asset Library", desc: "Pre-built models and components to speed up development" },
              { icon: "🎮", title: "Play & Test", desc: "Test your creations in real-time with play mode" },
            ].map((f) => (
              <div key={f.title} className="dlx-card">
                <div className="dlx-cardIcon">{f.icon}</div>
                <h3 className="dlx-cardTitle">{f.title}</h3>
                <p className="dlx-cardDesc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Publishing & Playing */}
      <section className="dlx-section">
        <div className="dlx-wrap">
          <h2>Build. Publish. Play.</h2>
          <div className="dlx-grid">
            <div className="dlx-card">
              <div className="dlx-cardIcon">💡</div>
              <h3 className="dlx-cardTitle">Create in Web Studio</h3>
              <p className="dlx-cardDesc">No download needed - start building immediately in your browser or download the desktop version for offline work.</p>
            </div>
            <div className="dlx-card">
              <div className="dlx-cardIcon">🚀</div>
              <h3 className="dlx-cardTitle">Publish Your Games</h3>
              <p className="dlx-cardDesc">Share your creations with the world. Publish your games to the DogeLinx platform with one click.</p>
            </div>
            <div className="dlx-card">
              <div className="dlx-cardIcon">🎯</div>
              <h3 className="dlx-cardTitle">Play Community Games</h3>
              <p className="dlx-cardDesc">Discover and play games created by the community. Browse the game library and find your next favorite game.</p>
            </div>
            <div className="dlx-card">
              <div className="dlx-cardIcon">⚡</div>
              <h3 className="dlx-cardTitle">Play in Browser</h3>
              <p className="dlx-cardDesc">Play any published game directly in your browser - no installation required.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Games */}
      <section className="dlx-section dlx-sectionAlt">
        <div className="dlx-wrap">
          <h2>🎮 Play Featured Games</h2>
          <p style={{ textAlign: "center", fontSize: "18px", color: "#cbd5e1", marginBottom: "40px", maxWidth: "700px", margin: "0 auto 40px auto" }}>
            Discover amazing games created by the DogeLinx community. Play instantly in your browser with no downloads required.
          </p>
          <div style={{ textAlign: "center" }}>
            <button 
              className="dlx-btn dlx-btnPrimary" 
              onClick={() => navigate("/games")}
              style={{ minWidth: "280px", fontSize: "18px", padding: "24px 56px" }}
            >
              🎯 Explore All Games
            </button>
          </div>
        </div>
      </section>

      {/* Download */}
      <section id="download" className="dlx-section">
        <div className="dlx-wrap">
          <h2>Download DogeLinx Studio</h2>
          <div className="dlx-grid">
            <DownloadCard icon="🪟" title="Windows" subtitle="Installer (Recommended)" onClick={openDownload} version="v0.1.0" />
            <DownloadCard icon="🪟" title="Windows" subtitle="Portable (No install)" onClick={openDownload} version="v0.1.0" />
            <DownloadCard icon="🍎" title="macOS" subtitle="Intel & Apple Silicon" onClick={openDownload} version="v0.1.0" />
            <DownloadCard icon="🐧" title="Linux" subtitle="AppImage" onClick={openDownload} version="v0.1.0" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="dlx-footer">
        <p style={{ marginBottom: 10 }}>© 2026 DogeLinx. Made with ❤️ for creators.</p>
        <p style={{ fontSize: 12, margin: 0 }}>
          <a className="dlx-link" href="https://github.com/username/dogelinx" target="_blank" rel="noreferrer">
            Open Source on GitHub
          </a>
        </p>
      </footer>

      {/* Download Flow Modal */}
      {showDownloadFlow && <DownloadFlow onClose={closeDownload} onComplete={closeDownload} />}

      {/* Auth Modal */}
      {showAuthModal && (
        <div style={{
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
        }}>
          <div style={{
            background: "#1f2937",
            border: "1px solid #374151",
            borderRadius: "16px",
            padding: "32px",
            maxWidth: "400px",
            width: "90%",
          }}>
            <h2 style={{ margin: "0 0 24px 0", color: "#f0fdf4", fontSize: "24px", fontWeight: "900" }}>
              {authMode === "signin" ? "Sign In" : "Create Account"}
            </h2>
            
            <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={authLoading}
                style={{
                  padding: "12px",
                  background: "#111827",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  color: "#e5e7eb",
                  fontSize: "14px",
                }}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={authLoading}
                style={{
                  padding: "12px",
                  background: "#111827",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  color: "#e5e7eb",
                  fontSize: "14px",
                }}
              />
              
              {authError && (
                <div style={{
                  padding: "12px",
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid #fca5a5",
                  borderRadius: "8px",
                  color: "#fca5a5",
                  fontSize: "14px",
                }}>
                  ⚠️ {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                style={{
                  padding: "12px",
                  background: "#60a5fa",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "900",
                  fontSize: "16px",
                  cursor: authLoading ? "not-allowed" : "pointer",
                  opacity: authLoading ? 0.6 : 1,
                }}
              >
                {authLoading ? "Loading..." : (authMode === "signin" ? "Sign In" : "Create Account")}
              </button>
            </form>

            <div style={{ marginTop: "16px", textAlign: "center" }}>
              <span style={{ color: "#cbd5e1", fontSize: "14px" }}>
                {authMode === "signin" ? "Don't have an account? " : "Already have an account? "}
              </span>
              <button
                onClick={() => {
                  setAuthMode(authMode === "signin" ? "signup" : "signin");
                  setAuthError(null);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#60a5fa",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "900",
                  textDecoration: "underline",
                }}
              >
                {authMode === "signin" ? "Sign Up" : "Sign In"}
              </button>
            </div>

            <button
              onClick={() => setShowAuthModal(false)}
              style={{
                marginTop: "20px",
                width: "100%",
                padding: "10px",
                background: "rgba(100, 116, 139, 0.16)",
                border: "1px solid #374151",
                borderRadius: "8px",
                color: "#cbd5e1",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DownloadCard({ icon, title, subtitle, onClick, version }) {
  return (
    <button className="dlx-downloadBtn" onClick={onClick} type="button">
      <div style={{ fontSize: 48 }}>{icon}</div>
      <div style={{ fontSize: 18, fontWeight: 900, color: "#f0fdf4" }}>{title}</div>
      <div style={{ fontSize: 12, color: "#9ca3af" }}>{subtitle}</div>
      <div className="dlx-pill">Download</div>
      <div className="dlx-version">{version}</div>
    </button>
  );
}