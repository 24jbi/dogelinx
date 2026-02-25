import React from "react";
import { useStudio } from "../store.js";
import { useUI } from "../uiStore.js";
import PublishDialog from "./PublishDialog.jsx";

export default function Ribbon() {
  const [showPublishDialog, setShowPublishDialog] = React.useState(false);

  const activeRibbonTab = useUI((u) => u.activeRibbonTab);
  const setActiveRibbonTab = useUI((u) => u.setActiveRibbonTab);

  const activeTool = useUI((u) => u.activeTool);
  const setActiveTool = useUI((u) => u.setActiveTool);

  const panels = useUI((u) => u.panels);
  const togglePanel = useUI((u) => u.togglePanel);

  const terrainMode = useUI((u) => u.terrainMode);
  const setTerrainMode = useUI((u) => u.setTerrainMode);

  const setTransformMode = useStudio((s) => s.setTransformMode);
  const isPlaying = useStudio((s) => s.isPlaying);
  const togglePlay = useStudio((s) => s.togglePlay);

  const insert = useStudio((s) => s.insert);
  const groupSelected = useStudio((s) => s.groupSelected);
  const ungroupSelected = useStudio((s) => s.ungroupSelected);

  // ✅ Snap state + setters (must exist in store.js)
  const snapEnabled = useStudio((s) => s.snapEnabled);
  const moveSnap = useStudio((s) => s.moveSnap);
  const rotateSnapDeg = useStudio((s) => s.rotateSnapDeg);
  const scaleSnap = useStudio((s) => s.scaleSnap);

  const setSnapEnabled = useStudio((s) => s.setSnapEnabled);
  const setMoveSnap = useStudio((s) => s.setMoveSnap);
  const setRotateSnapDeg = useStudio((s) => s.setRotateSnapDeg);
  const setScaleSnap = useStudio((s) => s.setScaleSnap);

  // Ensure activeRibbonTab is always valid
  const validTabs = ["home", "model", "test", "view"];
  const currentTab = validTabs.includes(activeRibbonTab) ? activeRibbonTab : "home";

  const handleToolClick = (toolName, transformMode) => {
    setActiveTool(toolName);
    if (transformMode) setTransformMode(transformMode);
  };

  const handleTabClick = (tab) => {
    const t = tab.toLowerCase();
    if (validTabs.includes(t)) setActiveRibbonTab(t);
  };

  const handleInsertPart = () => {
    insert("Part");
    setActiveTool("select");
  };

  const handleInsertTerrain = () => {
    insert("Terrain");
    setActiveTool("select");
  };

  const handleGroup = () => {
    groupSelected();
    setActiveTool("select");
  };

  const handleUngroup = () => {
    ungroupSelected();
    setActiveTool("select");
  };

  const tabStyle = (isActive) => ({
    padding: "4px 12px",
    background: isActive ? "#1f2937" : "transparent",
    border: "none",
    borderBottom: isActive ? "2px solid #60a5fa" : "2px solid transparent",
    color: isActive ? "#60a5fa" : "#9ca3af",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: isActive ? "600" : "400",
    transition: "all 150ms",
    height: "28px",
    display: "flex",
    alignItems: "center",
  });

  const toolButtonStyle = (isActive) => ({
    height: "28px",
    padding: "0 8px",
    background: isActive ? "#3b82f6" : "#1f2937",
    border: "1px solid #374151",
    borderRadius: "4px",
    color: isActive ? "#fff" : "#d1d5db",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: "500",
    transition: "all 150ms",
    whiteSpace: "nowrap",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  });

  const groupStyle = {
    display: "flex",
    gap: "4px",
    alignItems: "center",
    paddingRight: "8px",
    borderRight: "1px solid #374151",
    height: "100%",
  };

  const groupLabelStyle = {
    fontSize: "10px",
    color: "#6b7280",
    textTransform: "uppercase",
    fontWeight: "600",
    letterSpacing: "0.5px",
    marginRight: "2px",
    lineHeight: "1",
  };

  const toggleButtonStyle = (isActive) => ({
    height: "28px",
    padding: "0 10px",
    background: isActive ? "#22c55e" : "#374151",
    border: "1px solid #4b5563",
    borderRadius: "4px",
    color: "#fff",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: "500",
    transition: "all 150ms",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  });

  const snapInputStyle = (enabled) => ({
    height: "28px",
    width: "52px",
    padding: "2px 4px",
    background: "#1f2937",
    border: "1px solid #374151",
    borderRadius: "4px",
    color: "#d1d5db",
    fontSize: "10px",
    opacity: enabled ? 1 : 0.5,
  });

  return (
    <div style={{ background: "#0f1117", borderBottom: "1px solid #1f2937", display: "flex", flexDirection: "column" }}>
      {/* Tab Bar */}
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #1f2937", height: "28px" }}>
        {[
          { label: "🏠 Home", key: "home" },
          { label: "🔧 Model", key: "model" },
          { label: "▶️ Test", key: "test" },
          { label: "👁️ View", key: "view" },
        ].map(({ label, key }) => (
          <button key={key} onClick={() => handleTabClick(key)} style={tabStyle(currentTab === key)}>
            {label}
          </button>
        ))}
      </div>

      {/* Ribbon Content */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "2px",
          padding: "2px 6px",
          height: "44px",
          background: "#0a0f1f",
          overflowX: "auto",
        }}
      >
        {/* HOME TAB */}
        {currentTab === "home" && (
          <>
            {/* SELECT */}
            <div style={groupStyle}>
              <div style={groupLabelStyle}>🎯 Select</div>
              <button
                onClick={() => handleToolClick("select", null)}
                style={{ ...toolButtonStyle(activeTool === "select"), width: "32px", height: "32px", padding: "0" }}
                title="Selection Tool"
              >
                🎯
              </button>
            </div>

            {/* MOVE / ROTATE / SCALE */}
            <div style={groupStyle}>
              <div style={groupLabelStyle}>📐 Transform</div>
              <button onClick={() => handleToolClick("move", "translate")} style={toolButtonStyle(activeTool === "move")} title="Move (W)">
                ⬌
              </button>
              <button onClick={() => handleToolClick("rotate", "rotate")} style={toolButtonStyle(activeTool === "rotate")} title="Rotate (E)">
                ⟲
              </button>
              <button onClick={() => handleToolClick("scale", "scale")} style={toolButtonStyle(activeTool === "scale")} title="Scale (R)">
                ⊟
              </button>
            </div>

            {/* SNAP */}
            <div style={groupStyle}>
              <div style={groupLabelStyle}>🔒 Snap</div>

              <button
                onClick={() => setSnapEnabled(!snapEnabled)}
                style={toolButtonStyle(snapEnabled)}
                title={`Snap ${snapEnabled ? "ON" : "OFF"}`}
              >
                {snapEnabled ? "🔒" : "🔓"}
              </button>

              <input
                type="number"
                value={moveSnap}
                min="0"
                step="0.1"
                onChange={(e) => setMoveSnap(e.target.value)}
                disabled={!snapEnabled}
                style={snapInputStyle(snapEnabled)}
                title="Move snap (studs)"
              />

              <input
                type="number"
                value={rotateSnapDeg}
                min="0"
                step="1"
                onChange={(e) => setRotateSnapDeg(e.target.value)}
                disabled={!snapEnabled}
                style={snapInputStyle(snapEnabled)}
                title="Rotate snap (degrees)"
              />

              <input
                type="number"
                value={scaleSnap}
                min="0"
                step="0.05"
                onChange={(e) => setScaleSnap(e.target.value)}
                disabled={!snapEnabled}
                style={snapInputStyle(snapEnabled)}
                title="Scale snap"
              />
            </div>

            {/* PLAY */}
            <div style={{ ...groupStyle, borderRight: "none" }}>
              <div style={groupLabelStyle}>▶️ Play</div>
              <button
                onClick={togglePlay}
                style={{
                  ...toolButtonStyle(isPlaying),
                  background: isPlaying ? "#ef4444" : "#22c55e",
                  color: "#fff",
                  fontWeight: "600",
                  paddingLeft: "12px",
                  paddingRight: "12px",
                }}
                title="Play (F5)"
              >
                {isPlaying ? "⏹ Stop" : "▶ Play"}
              </button>
              <button
                onClick={() => setShowPublishDialog(true)}
                style={{
                  ...toolButtonStyle(false),
                  background: "#8b5cf6",
                  color: "#fff",
                  fontWeight: "600",
                  paddingLeft: "12px",
                  paddingRight: "12px",
                }}
                title="Publish Game"
              >
                🚀 Publish
              </button>
            </div>
          </>
        )}

        {/* MODEL TAB */}
        {currentTab === "model" && (
          <>
            <div style={groupStyle}>
              <div style={groupLabelStyle}>➕ Insert</div>
              <button onClick={handleInsertPart} style={toolButtonStyle(false)} title="Insert Part">
                ➕ Part
              </button>
              <button onClick={handleInsertTerrain} style={toolButtonStyle(false)} title="Insert Terrain">
                🏔 Terrain
              </button>
            </div>

            <div style={groupStyle}>
              <div style={groupLabelStyle}>✏️ Edit</div>
              <button onClick={handleGroup} style={toolButtonStyle(false)} title="Group Objects (Ctrl+G)">
                📦 Group
              </button>
              <button onClick={handleUngroup} style={toolButtonStyle(false)} title="Ungroup Objects (Ctrl+Shift+G)">
                📂 Ungroup
              </button>
            </div>

            <div style={{ ...groupStyle, borderRight: "none" }}>
              <div style={groupLabelStyle}>📝 Scripting</div>
              <button
                onClick={() => handleToolClick("luau-editor", null)}
                style={toolButtonStyle(activeTool === "luau-editor")}
                title="Luau Script Editor"
              >
                📝 Script
              </button>
              <button
                onClick={() => setTerrainMode(!terrainMode)}
                style={{ ...toolButtonStyle(terrainMode), background: terrainMode ? "#8b5cf6" : "#1f2937" }}
                title="Toggle Terrain Edit Mode"
              >
                🏔 Terrain Mode
              </button>
            </div>
          </>
        )}

        {/* TEST TAB */}
        {currentTab === "test" && (
          <>
            <div style={groupStyle}>
              <div style={groupLabelStyle}>▶️ Playtest</div>
              <button
                onClick={togglePlay}
                style={{ ...toolButtonStyle(isPlaying), background: isPlaying ? "#ef4444" : "#22c55e", color: "#fff", fontWeight: "600" }}
                title="Play Game (F5)"
              >
                {isPlaying ? "⏹ Stop" : "▶ Play"}
              </button>
            </div>

            <div style={{ ...groupStyle, borderRight: "none" }}>
              <div style={groupLabelStyle}>🐛 Debug</div>
              <button onClick={() => handleToolClick("console", null)} style={toolButtonStyle(activeTool === "console")} title="Toggle Console">
                🖥 Console
              </button>
              <button onClick={() => handleToolClick("network", null)} style={toolButtonStyle(activeTool === "network")} title="Network Monitor">
                🌐 Network
              </button>
            </div>
          </>
        )}

        {/* VIEW TAB */}
        {currentTab === "view" && (
          <>
            <div style={groupStyle}>
              <div style={groupLabelStyle}>📺 Panels</div>
              <button onClick={() => togglePanel("explorer")} style={toggleButtonStyle(panels.explorer)} title="Toggle Explorer">
                🌳 Explorer
              </button>
              <button onClick={() => togglePanel("properties")} style={toggleButtonStyle(panels.properties)} title="Toggle Properties">
                ⚙ Properties
              </button>
              <button onClick={() => togglePanel("output")} style={toggleButtonStyle(panels.output)} title="Toggle Output">
                📋 Output
              </button>
            </div>

            <div style={{ ...groupStyle, borderRight: "none" }}>
              <div style={groupLabelStyle}>👁️ View</div>
              <span style={{ fontSize: "11px", color: "#6b7280" }}>View controls coming soon</span>
            </div>
          </>
        )}
      </div>

      {showPublishDialog && <PublishDialog onClose={() => setShowPublishDialog(false)} />}
    </div>
  );
}