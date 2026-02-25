import React, { useEffect, useMemo, useState } from "react";
import { CharacterAppearance } from "../R6Rig.js";

export function PlaytestAvatarUI({ isPlaying }) {
  const [currentPreset, setCurrentPreset] = useState("default");
  const [ready, setReady] = useState(false);

  const presets = useMemo(() => Object.keys(CharacterAppearance.PRESETS || {}), []);

  useEffect(() => {
    if (!isPlaying) return;

    const t = setInterval(() => {
      const appearance = window.__characterAppearance;
      if (appearance) {
        setReady(true);
        setCurrentPreset(appearance.presetName || "default");
        clearInterval(t);
      }
    }, 100);

    return () => clearInterval(t);
  }, [isPlaying]);

  if (!isPlaying) return null;

  const handlePresetChange = (presetName) => {
    const appearance = window.__characterAppearance;
    if (!appearance) return;
    appearance.setPreset(presetName);
    setCurrentPreset(presetName);
  };

  return (
    <div style={{
      position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)",
      background: "rgba(0,0,0,0.7)", border: "1px solid #0e639c",
      borderRadius: 8, padding: 12, zIndex: 1000, backdropFilter: "blur(4px)",
      maxWidth: 520
    }}>
      <div style={{ color: "#aaa", fontSize: 11, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
        👤 Avatar Presets {!ready ? "(loading…)" : ""}
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", opacity: ready ? 1 : 0.5 }}>
        {presets.map((preset) => (
          <button
            key={preset}
            disabled={!ready}
            onClick={() => handlePresetChange(preset)}
            style={{
              padding: "6px 12px",
              background: currentPreset === preset ? "#0e639c" : "rgba(255,255,255,0.1)",
              border: `1px solid ${currentPreset === preset ? "#0e639c" : "#555"}`,
              color: "#fff",
              borderRadius: 4,
              cursor: ready ? "pointer" : "not-allowed",
              fontSize: 10,
              textTransform: "capitalize",
              opacity: currentPreset === preset ? 1 : 0.75,
              transition: "all 0.2s ease",
            }}
          >
            {preset}
          </button>
        ))}
      </div>
    </div>
  );
}
