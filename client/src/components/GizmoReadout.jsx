import React, { useEffect, useMemo, useRef, useState } from "react";
import { useStudio } from "../store.js";
import { useUI } from "../uiStore.js";

const ZERO = Object.freeze({ x: 0, y: 0, z: 0 });

function toVec3(v) {
  if (!v || typeof v !== "object") return ZERO;
  const x = Number(v.x);
  const y = Number(v.y);
  const z = Number(v.z);
  return {
    x: Number.isFinite(x) ? x : 0,
    y: Number.isFinite(y) ? y : 0,
    z: Number.isFinite(z) ? z : 0,
  };
}

function fmt(n, digits = 2) {
  const v = Number(n);
  if (!Number.isFinite(v)) return "0.00";
  const s = v.toFixed(digits);
  // keep minus sign, add + for positives like Roblox readouts
  return v > 0 ? `+${s}` : s;
}

function modeTitle(mode) {
  return mode === "translate" ? "Position Δ" : mode === "rotate" ? "Rotation Δ" : "Scale Δ";
}

function modeUnits(mode) {
  return mode === "translate" ? "studs" : mode === "rotate" ? "deg" : "%";
}

// If your store already has gizmo state, we use it. If not, we listen to events.
function useGizmoTelemetry() {
  const transformMode = useStudio((s) => s.transformMode);

  // optional store fields (safe if missing)
  const storeActive = useStudio((s) => s.gizmoActive ?? s.gizmo?.active ?? false);
  const storeDelta = useStudio((s) => s.gizmoDelta ?? s.gizmo?.delta ?? null);

  const [evtActive, setEvtActive] = useState(false);
  const [evtDelta, setEvtDelta] = useState(ZERO);
  const [evtMode, setEvtMode] = useState(null);

  // Event fallback: CustomEvent("dlx:gizmo", { detail: { active, delta, mode } })
  useEffect(() => {
    const onEvt = (e) => {
      const d = e?.detail || {};
      if (typeof d.active === "boolean") setEvtActive(d.active);
      if (d.delta) setEvtDelta(toVec3(d.delta));
      if (d.mode) setEvtMode(d.mode);
    };
    window.addEventListener("dlx:gizmo", onEvt);
    return () => window.removeEventListener("dlx:gizmo", onEvt);
  }, []);

  const active = !!(storeActive || evtActive);
  const delta = toVec3(storeDelta || evtDelta);
  const mode = evtMode || transformMode || "translate";

  return { active, delta, mode };
}

export function GizmoReadoutOverlay() {
  const { active, delta, mode } = useGizmoTelemetry();

  // Don’t flicker if active toggles fast: hold for a moment after last activity
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef(null);

  useEffect(() => {
    if (active) {
      setVisible(true);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      return;
    }
    // hide shortly after release
    hideTimer.current = setTimeout(() => setVisible(false), 180);
    return () => hideTimer.current && clearTimeout(hideTimer.current);
  }, [active]);

  const units = modeUnits(mode);

  // Display transforms:
  // - translate: raw studs
  // - rotate: assume radians or degrees? We’ll treat values > 6.3 as already degrees; otherwise radians -> degrees
  // - scale: show as percent delta (0.05 => +5%)
  const display = useMemo(() => {
    let x = delta.x, y = delta.y, z = delta.z;

    if (mode === "rotate") {
      const likelyDeg = Math.max(Math.abs(x), Math.abs(y), Math.abs(z)) > 6.3;
      if (!likelyDeg) {
        const rad2deg = 180 / Math.PI;
        x *= rad2deg; y *= rad2deg; z *= rad2deg;
      }
    } else if (mode === "scale") {
      x *= 100; y *= 100; z *= 100;
    }

    return { x, y, z };
  }, [delta, mode]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 14,
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(15, 17, 23, 0.92)",
        color: "#60a5fa",
        border: "1px solid #334155",
        borderRadius: 10,
        padding: "10px 12px",
        fontFamily: "Menlo, Monaco, monospace",
        fontSize: 12,
        pointerEvents: "none",
        zIndex: 100,
        minWidth: 210,
        boxShadow: "0 16px 50px rgba(0,0,0,0.45)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
        <div style={{ fontWeight: 900, color: "#e5e7eb" }}>{modeTitle(mode)}</div>
        <div style={{ opacity: 0.7 }}>{units}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "24px 1fr", rowGap: 2 }}>
        <div style={{ color: "#94a3b8" }}>X</div>
        <div>{fmt(display.x, mode === "rotate" ? 1 : 2)}</div>

        <div style={{ color: "#94a3b8" }}>Y</div>
        <div>{fmt(display.y, mode === "rotate" ? 1 : 2)}</div>

        <div style={{ color: "#94a3b8" }}>Z</div>
        <div>{fmt(display.z, mode === "rotate" ? 1 : 2)}</div>
      </div>
    </div>
  );
}

export function GizmoHints() {
  const transformMode = useStudio((s) => s.transformMode);
  const gizmoHintsVisible = useUI((u) => u.gizmoHintsVisible);
  const setGizmoHintsVisible = useUI((u) => u.setGizmoHintsVisible);

  if (!gizmoHintsVisible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 18,
        right: 18,
        background: "rgba(15, 17, 23, 0.95)",
        border: "1px solid #374151",
        borderRadius: 10,
        padding: "10px 12px",
        color: "#9ca3af",
        fontFamily: "Menlo, Monaco, monospace",
        fontSize: 12,
        pointerEvents: "auto",
        zIndex: 100,
        maxWidth: 280,
        boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontWeight: 900, color: "#e5e7eb" }}>🎯 Gizmo</div>
        <button
          onClick={() => setGizmoHintsVisible(false)}
          style={{
            background: "transparent",
            border: "none",
            color: "#6b7280",
            cursor: "pointer",
            fontSize: 14,
            padding: "0 2px",
            transition: "color 150ms",
          }}
          onMouseEnter={(e) => (e.target.style.color = "#ef4444")}
          onMouseLeave={(e) => (e.target.style.color = "#6b7280")}
          title="Hide gizmo hints (Ctrl+Alt+H to show)"
        >
          ✕
        </button>
      </div>
      <div>W / E / R: Move / Rotate / Scale</div>
      <div style={{ marginTop: 4 }}>
        Mode:{" "}
        <span style={{ color: "#cbd5e1", fontWeight: 800 }}>
          {transformMode === "translate" ? "📍 Move" : transformMode === "rotate" ? "⟲ Rotate" : "📏 Scale"}
        </span>
      </div>
      <div style={{ marginTop: 8, color: "#6b7280", fontSize: 11, lineHeight: 1.35 }}>
        Tip: Hold <b>Shift</b> for precision • Hold <b>Ctrl</b> to snap (if you implement snapping)
      </div>
    </div>
  );
}