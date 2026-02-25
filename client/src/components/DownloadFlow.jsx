import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import TermsOfService from "./TermsOfService.jsx";

function detectPlatform() {
  const ua = (navigator.userAgent || "").toLowerCase();
  const plat = (navigator.platform || "").toLowerCase();

  if (ua.includes("windows") || plat.includes("win")) return "windows";
  if (ua.includes("mac") || plat.includes("mac")) return "mac";
  if (ua.includes("linux") || plat.includes("linux")) return "linux";
  return "unknown";
}

function isValidEmail(email) {
  const e = (email || "").trim();
  // simple/OK email check (don’t overdo it)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

export default function DownloadFlow({ onClose, onComplete }) {
  const [step, setStep] = useState("auth"); // "auth" | "tos" | "download"
  const [isSignUp, setIsSignUp] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const firstInputRef = useRef(null);
  const platform = useMemo(() => detectPlatform(), []);

  // Replace these with your real release URLs
  const downloadLinks = useMemo(
    () => ({
      windows_installer: "https://github.com/username/dogelinx/releases/download/v0.1.0/DogeLinx-Studio-0.1.0.exe",
      windows_portable: "https://github.com/username/dogelinx/releases/download/v0.1.0/DogeLinx-Studio-portable-0.1.0.exe",
      mac: "https://github.com/username/dogelinx/releases/download/v0.1.0/DogeLinx-Studio-0.1.0.dmg",
      linux: "https://github.com/username/dogelinx/releases/download/v0.1.0/DogeLinx-Studio-0.1.0.AppImage",
    }),
    []
  );

  const recommendedKey = useMemo(() => {
    if (platform === "windows") return "windows_installer";
    if (platform === "mac") return "mac";
    if (platform === "linux") return "linux";
    return "windows_installer";
  }, [platform]);

  // Focus first input on open/step change
  useEffect(() => {
    const t = setTimeout(() => firstInputRef.current?.focus?.(), 0);
    return () => clearTimeout(t);
  }, [step]);

  // Escape closes
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const validateAuth = useCallback(() => {
    if (!isValidEmail(email)) return "Enter a valid email address.";
    if (!password || password.length < 8) return "Password must be at least 8 characters.";
    if (isSignUp) {
      if (!confirmPassword) return "Confirm your password.";
      if (password !== confirmPassword) return "Passwords do not match.";
    }
    return "";
  }, [email, password, confirmPassword, isSignUp]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");

    const v = validateAuth();
    if (v) {
      setError(v);
      return;
    }

    setLoading(true);
    try {
      // TODO: Replace with real auth
      // Example:
      // - Supabase: await supabase.auth.signInWithPassword({ email, password })
      // - Or signUp: await supabase.auth.signUp({ email, password })
      await new Promise((r) => setTimeout(r, 450));

      setStep("tos");
    } catch (err) {
      console.error(err);
      setError("Sign in failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTosAccept = () => setStep("download");

  const handleTosDecline = () => {
    // back to auth, keep email (nice UX), clear passwords
    setStep("auth");
    setPassword("");
    setConfirmPassword("");
    setError("");
  };

  const title =
    step === "auth"
      ? isSignUp
        ? "Create Account"
        : "Sign In"
      : step === "tos"
      ? "Terms of Service"
      : "Download Studio";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        style={{
          background: "#0f1219",
          border: "1px solid #374151",
          borderRadius: 12,
          maxWidth: 520,
          width: "100%",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: 18,
            borderBottom: "1px solid #374151",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#1a2a3a",
          }}
        >
          <h2 style={{ color: "#f0fdf4", margin: 0, fontSize: 18 }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "1px solid #334155",
              color: "#9ca3af",
              fontSize: 18,
              cursor: "pointer",
              borderRadius: 10,
              width: 34,
              height: 34,
              display: "grid",
              placeItems: "center",
            }}
            aria-label="Close"
            title="Close (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto" }}>
          {step === "auth" && (
            <div style={{ padding: 24 }}>
              <form onSubmit={handleAuth}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", color: "#cbd5e1", marginBottom: 8, fontWeight: 700 }}>
                    Email
                  </label>
                  <input
                    ref={firstInputRef}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      background: "#111827",
                      color: "#cbd5e1",
                      border: "1px solid #404854",
                      borderRadius: 10,
                      outline: "none",
                      boxSizing: "border-box",
                      fontSize: 14,
                    }}
                  />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", color: "#cbd5e1", marginBottom: 8, fontWeight: 700 }}>
                    Password
                  </label>

                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete={isSignUp ? "new-password" : "current-password"}
                      style={{
                        flex: 1,
                        padding: "10px 12px",
                        background: "#111827",
                        color: "#cbd5e1",
                        border: "1px solid #404854",
                        borderRadius: 10,
                        outline: "none",
                        boxSizing: "border-box",
                        fontSize: 14,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      style={{
                        padding: "10px 12px",
                        background: "#0b1220",
                        border: "1px solid #334155",
                        color: "#cbd5e1",
                        borderRadius: 10,
                        cursor: "pointer",
                        fontWeight: 800,
                        fontSize: 12,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {showPass ? "Hide" : "Show"}
                    </button>
                  </div>

                  <div style={{ marginTop: 6, color: "#64748b", fontSize: 12 }}>
                    Min 8 characters.
                  </div>
                </div>

                {isSignUp && (
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", color: "#cbd5e1", marginBottom: 8, fontWeight: 700 }}>
                      Confirm Password
                    </label>
                    <input
                      type={showPass ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        background: "#111827",
                        color: "#cbd5e1",
                        border: "1px solid #404854",
                        borderRadius: 10,
                        outline: "none",
                        boxSizing: "border-box",
                        fontSize: 14,
                      }}
                    />
                  </div>
                )}

                {error && (
                  <div
                    style={{
                      padding: 12,
                      background: "rgba(239, 68, 68, 0.1)",
                      border: "1px solid #ef4444",
                      color: "#fca5a5",
                      borderRadius: 10,
                      marginBottom: 14,
                      fontSize: 13,
                    }}
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: 12,
                    background: loading
                      ? "rgba(60, 130, 246, 0.35)"
                      : "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: 10,
                    fontWeight: 900,
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.65 : 1,
                    marginBottom: 12,
                  }}
                >
                  {loading ? "Loading..." : isSignUp ? "Create Account" : "Sign In"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp((v) => !v);
                    setError("");
                    setPassword("");
                    setConfirmPassword("");
                  }}
                  style={{
                    width: "100%",
                    padding: 12,
                    background: "transparent",
                    color: "#60a5fa",
                    border: "1px solid #3b82f6",
                    borderRadius: 10,
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
                </button>
              </form>
            </div>
          )}

          {step === "tos" && <TermsOfService onAccept={handleTosAccept} onDecline={handleTosDecline} />}

          {step === "download" && (
            <div style={{ padding: 24 }}>
              <div
                style={{
                  padding: 14,
                  background: "rgba(96, 165, 250, 0.1)",
                  border: "1px solid #60a5fa",
                  borderRadius: 10,
                  marginBottom: 16,
                  color: "#cbd5e1",
                  fontSize: 13,
                }}
              >
                ✅ You’re all set. Pick your OS to download DogeLinx Studio.
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                <DownloadOption
                  recommended={recommendedKey === "windows_installer"}
                  icon="🪟"
                  title="Windows"
                  subtitle="Installer (Recommended)"
                  link={downloadLinks.windows_installer}
                  onDownload={(link) => onComplete?.({ platform: "windows", link })}
                />
                <DownloadOption
                  recommended={recommendedKey === "windows_portable"}
                  icon="🪟"
                  title="Windows"
                  subtitle="Portable (No install)"
                  link={downloadLinks.windows_portable}
                  onDownload={(link) => onComplete?.({ platform: "windows", link })}
                />
                <DownloadOption
                  recommended={recommendedKey === "mac"}
                  icon="🍎"
                  title="macOS"
                  subtitle="Intel & Apple Silicon"
                  link={downloadLinks.mac}
                  onDownload={(link) => onComplete?.({ platform: "mac", link })}
                />
                <DownloadOption
                  recommended={recommendedKey === "linux"}
                  icon="🐧"
                  title="Linux"
                  subtitle="AppImage"
                  link={downloadLinks.linux}
                  onDownload={(link) => onComplete?.({ platform: "linux", link })}
                />
              </div>

              <p style={{ color: "#9ca3af", fontSize: 12, marginTop: 16, textAlign: "center" }}>
                By downloading, you agree to the Terms of Service.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DownloadOption({ icon, title, subtitle, link, recommended, onDownload }) {
  const [hover, setHover] = useState(false);

  return (
    <a
      href={link}
      target="_blank"
      rel="noreferrer"
      onClick={() => onDownload?.(link)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        background: hover ? "rgba(31, 41, 55, 0.9)" : "rgba(31, 41, 55, 0.6)",
        border: `1px solid ${recommended ? "#60a5fa" : hover ? "#60a5fa" : "#374151"}`,
        borderRadius: 12,
        textDecoration: "none",
        color: "#cbd5e1",
        cursor: "pointer",
      }}
    >
      <div style={{ fontSize: 26 }}>{icon}</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 900, color: "#f0fdf4", display: "flex", alignItems: "center", gap: 8 }}>
          {title}
          {recommended && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 900,
                color: "#0b1220",
                background: "#60a5fa",
                padding: "2px 8px",
                borderRadius: 999,
              }}
            >
              Recommended
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: "#9ca3af" }}>{subtitle}</div>
      </div>

      <div style={{ fontSize: 18, opacity: 0.9 }}>→</div>
    </a>
  );
}