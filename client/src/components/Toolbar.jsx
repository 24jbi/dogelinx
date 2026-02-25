import React, { useRef, useState } from "react";
import { useStudio } from "../store.js";
import { useUI } from "../uiStore.js";
import Auth from "./Auth.jsx";
import ProjectManager from "./ProjectManager.jsx";

export default function Toolbar() {
  const insert = useStudio((s) => s.insert);
  const addBoxAt = useStudio((s) => s.addBoxAt);
  const addSphereAt = useStudio((s) => s.addSphereAt);
  const addPartAt = useStudio((s) => s.addPartAt);

  const removeSelected = useStudio((s) => s.removeSelected);
  const duplicateSelected = useStudio((s) => s.duplicateSelected);
  const groupSelected = useStudio((s) => s.groupSelected);
  const ungroupSelected = useStudio((s) => s.ungroupSelected);

  const isPlaying = useStudio((s) => s.isPlaying);
  const startPlay = useStudio((s) => s.startPlay);
  const stopPlay = useStudio((s) => s.stopPlay);
  const equipFirstTool = useStudio((s) => s.equipFirstTool);
  const unequipTool = useStudio((s) => s.unequipTool);

  const exportJSON = useStudio((s) => s.exportJSON);
  const importJSON = useStudio((s) => s.importJSON);
  const addTerrain = useStudio((s) => s.addTerrain);

  const openModal = useUI((u) => u.openModal);
  const panels = useUI((u) => u.panels);
  const togglePanel = useUI((u) => u.togglePanel);
  const setCommandBarOpen = useUI((u) => u.setCommandBarOpen);
  const terrainMode = useUI((u) => u.terrainMode);
  const setTerrainMode = useUI((u) => u.setTerrainMode);
  
  const [viewMenuOpen, setViewMenuOpen] = useState(false);

  const fileRef = useRef(null);

  const download = () => {
    const text = exportJSON();
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "place.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImportClick = () => fileRef.current?.click();
  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const ok = importJSON(text);
    if (!ok) alert("Invalid JSON.");
    e.target.value = "";
  };

  const togglePlay = () => (isPlaying ? stopPlay() : startPlay());

  return (
    <div className="dlx-toolbar">
      <div className="dlx-toolbar-left">
        <div className="dlx-brand">
          <span className="dlx-brand-dot" />
          DogeLinx Studio
        </div>

        <div className="dlx-sep" />

        <ProjectManager />

        <div className="dlx-sep" />

        <div className="dlx-group">
          <button className="dlx-btn" onClick={() => addPartAt("Part", [0, 2, 0])}>Part</button>
          <button className="dlx-btn" onClick={() => addPartAt("Ball", [0, 2, 0])}>Ball</button>
          <button className="dlx-btn" onClick={() => addPartAt("Cylinder", [0, 2, 0])}>Cylinder</button>
          <button className="dlx-btn" onClick={() => addPartAt("Wedge", [0, 2, 0])}>Wedge</button>
        </div>

        <div className="dlx-sep" />

        <div className="dlx-group">
          <button className="dlx-btn" onClick={() => insert("Folder")}>Folder</button>
          <button className="dlx-btn" onClick={() => insert("RemoteEvent")}>RemoteEvent</button>
          <button className="dlx-btn" onClick={() => insert("ScreenGui")}>ScreenGui</button>
          <button className="dlx-btn" onClick={() => insert("Tool")}>Tool</button>
        </div>

        <div className="dlx-sep" />

        <div className="dlx-group">
          <button className="dlx-btn" onClick={duplicateSelected} title="Ctrl+D">Duplicate</button>
          <button className="dlx-btn" onClick={groupSelected}>Group</button>
          <button className="dlx-btn" onClick={ungroupSelected}>Ungroup</button>
          <button className="dlx-btn danger" onClick={removeSelected} title="Del">Delete</button>
        </div>

        <div className="dlx-sep" />

        <div className="dlx-group">
          <button className="dlx-btn" onClick={addTerrain} title="Add terrain to workspace">Terrain</button>
          <button 
            className={`dlx-btn ${terrainMode ? "active" : ""}`} 
            onClick={() => setTerrainMode(!terrainMode)}
            title="Toggle terrain painting mode"
          >
            {terrainMode ? "Painting" : "Edit Mode"}
          </button>
        </div>

        <div className="dlx-sep" />

        {/* VIEW MENU */}
        <div style={{ position: "relative", display: "inline-block" }}>
          <button 
            className="dlx-btn" 
            onClick={() => setViewMenuOpen(!viewMenuOpen)}
            title="Toggle panels"
          >
            View
          </button>
          {viewMenuOpen && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                background: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "4px",
                minWidth: "160px",
                zIndex: 1000,
                marginTop: "4px",
              }}
            >
              <div
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  color: panels.explorer ? "#60a5fa" : "#9ca3af",
                  fontSize: "12px",
                }}
                onClick={() => {
                  togglePanel("explorer");
                  setViewMenuOpen(false);
                }}
              >
                <input
                  type="checkbox"
                  checked={panels.explorer}
                  onChange={() => {}}
                  style={{ marginRight: "8px", cursor: "pointer" }}
                />
                Explorer
              </div>
              <div
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  color: panels.properties ? "#60a5fa" : "#9ca3af",
                  fontSize: "12px",
                }}
                onClick={() => {
                  togglePanel("properties");
                  setViewMenuOpen(false);
                }}
              >
                <input
                  type="checkbox"
                  checked={panels.properties}
                  onChange={() => {}}
                  style={{ marginRight: "8px", cursor: "pointer" }}
                />
                Properties
              </div>
              <div
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  color: panels.output ? "#60a5fa" : "#9ca3af",
                  fontSize: "12px",
                }}
                onClick={() => {
                  togglePanel("output");
                  setViewMenuOpen(false);
                }}
              >
                <input
                  type="checkbox"
                  checked={panels.output}
                  onChange={() => {}}
                  style={{ marginRight: "8px", cursor: "pointer" }}
                />
                Output
              </div>
              <div style={{ borderTop: "1px solid #374151", margin: "4px 0" }} />
              <div
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                  color: "#9ca3af",
                  fontSize: "12px",
                }}
                onClick={() => {
                  setCommandBarOpen(true);
                  setViewMenuOpen(false);
                }}
              >
                Command Bar <span style={{ float: "right", color: "#6b7280", fontSize: "10px" }}>Ctrl+K</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="dlx-toolbar-right">
        <button 
          className="dlx-btn" 
          onClick={() => setCommandBarOpen(true)}
          title="Open Command Bar (Ctrl+K)"
        >
          💬 Command
        </button>

        <div className="dlx-sep" />

        <button className="dlx-btn" onClick={() => openModal("assets")}>Assets</button>
        {!isPlaying && (
          <button className="dlx-btn" onClick={() => openModal("avatar")}>Avatar</button>
        )}

        <div className="dlx-sep" />

        <button className={`dlx-btn ${isPlaying ? "active" : ""}`} onClick={togglePlay} title="F5">
          {isPlaying ? "Stop" : "Play"}
        </button>

        {isPlaying && (
          <>
            <button className="dlx-btn" onClick={equipFirstTool}>Equip</button>
            <button className="dlx-btn" onClick={unequipTool}>Unequip</button>
          </>
        )}

        <div className="dlx-sep" />

        <button className="dlx-btn" onClick={download}>Export</button>
        <button className="dlx-btn" onClick={onImportClick}>Import</button>

        <div className="dlx-sep" />

        <Auth />
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        onChange={onFile}
        style={{ display: "none" }}
      />
    </div>
  );
}
