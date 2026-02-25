import React, { useEffect, useRef } from "react";
import { useStudio } from "../store.js";
import { useUI } from "../uiStore.js";
import LuaEditor from "./LuaEditor.jsx";

export default function ScriptEditorModal() {
  const scriptEditorModal = useUI((u) => u.scriptEditorModal);
  const closeScriptEditor = useUI((u) => u.closeScriptEditor);

  const objects = useStudio((s) => s.objects);
  const setScriptSource = useStudio((s) => s.setScriptSource);

  const script = objects.find((o) => o.id === scriptEditorModal.scriptId);
  const source = script?.source || "";

  const modalRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape" && scriptEditorModal.open) {
        e.preventDefault();
        closeScriptEditor();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [scriptEditorModal.open, closeScriptEditor]);

  if (!scriptEditorModal.open || !script) return null;

  return (
    <div
      ref={modalRef}
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
      onClick={(e) => {
        if (e.target === modalRef.current) closeScriptEditor();
      }}
    >
      <div
        style={{
          width: "90%",
          height: "90%",
          maxWidth: "1200px",
          background: "#0f1219",
          borderRadius: 12,
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
          border: "1px solid #334155",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #334155",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#0a0f1a",
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 16 }}>📜</span>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#e5e7eb" }}>
                {scriptEditorModal.scriptName}
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                {script.className}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={closeScriptEditor}
              title="Close (Esc)"
              style={{
                padding: "8px 16px",
                background: "#1f2937",
                border: "1px solid #374151",
                borderRadius: 8,
                color: "#d1d5db",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                transition: "all 150ms",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "#2d3748";
                e.target.style.color = "#e5e7eb";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "#1f2937";
                e.target.style.color = "#d1d5db";
              }}
            >
              ✕ Close (Esc)
            </button>
          </div>
        </div>

        {/* Editor Container */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            backgroundColor: "#05070d",
            padding: 16,
          }}
        >
          <div style={{ height: "100%" }}>
            <LuaEditor
              value={source}
              onChange={(newSource) => setScriptSource(script.id, newSource)}
            />
          </div>
        </div>

        {/* Footer Info */}
        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid #334155",
            background: "#0a0f1a",
            borderBottomLeftRadius: 12,
            borderBottomRightRadius: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 11,
            color: "#94a3b8",
          }}
        >
          <div>{source.split("\n").length} lines</div>
          <div>
            <span style={{ marginRight: 16 }}>Ctrl+/ to toggle comments</span>
            <span>Press Esc to exit</span>
          </div>
        </div>
      </div>
    </div>
  );
}
