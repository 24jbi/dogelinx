import React, { useEffect, useRef, useState, useCallback } from "react";
import Ribbon from "./Ribbon.jsx";
import ConsolePanel from "./ConsolePanel.jsx";
import CommandBar from "./CommandBar.jsx";
import { GizmoHints } from "./GizmoReadout.jsx";
import SceneCanvas from "./SceneCanvas.jsx";
import Hierarchy from "./Hierarchy.jsx";
import Inspector from "./Inspector.jsx";
import ContextMenu from "./ContextMenu.jsx";
import AssetManager from "./AssetManager.jsx";
import AvatarEditor from "./AvatarEditor.jsx";
import ScriptEditorModal from "./ScriptEditorModal.jsx";
import { useStudio } from "../store.js";
import { useUI } from "../uiStore.js";

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const DOCK_MIN_LEFT = 220;
const DOCK_MIN_RIGHT = 260;
const CENTER_MIN = 420; // keep viewport usable
const DOCK_GUTTER = 16; // little safety spacing

function isTypingTarget(el) {
  if (!el) return false;
  const tag = el.tagName?.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || el.isContentEditable;
}

export default function Layout() {
  const dock = useUI((u) => u.dock);
  const setDock = useUI((u) => u.setDock);
  const panels = useUI((u) => u.panels);
  const togglePanel = useUI((u) => u.togglePanel);

  // overlay states (so hotkeys don't fire while UI overlays are active)
  const modal = useUI((u) => u.modal);
  const menu = useUI((u) => u.menu);
  const commandBarOpen = useUI((u) => u.commandBarOpen);

  // Studio actions
  const setTransformMode = useStudio((s) => s.setTransformMode);
  const toggleTransformSpace = useStudio((s) => s.toggleTransformSpace);
  const removeSelected = useStudio((s) => s.removeSelected);
  const duplicateSelected = useStudio((s) => s.duplicateSelected);
  const groupSelected = useStudio((s) => s.groupSelected);
  const ungroupSelected = useStudio((s) => s.ungroupSelected);
  const insert = useStudio((s) => s.insert);
  const isPlaying = useStudio((s) => s.isPlaying);
  const startPlay = useStudio((s) => s.startPlay);
  const stopPlay = useStudio((s) => s.stopPlay);
  const clearLogs = useStudio((s) => s.clearLogs);

  const [outputCollapsed, setOutputCollapsed] = useState(false);

  const dragRef = useRef(null);

  const onDividerDown = useCallback(
    (side) => (e) => {
      e.preventDefault();
      e.stopPropagation();

      // snapshot start values so clamp math is stable during drag
      dragRef.current = {
        side,
        startX: e.clientX,
        startLeft: dock.left,
        startRight: dock.right,
        explorerOpen: !!panels.explorer,
        propsOpen: !!panels.properties,
      };
    },
    [dock.left, dock.right, panels.explorer, panels.properties]
  );

  // Drag listeners: only do work while dragging
  useEffect(() => {
    const onMove = (e) => {
      const d = dragRef.current;
      if (!d) return;

      const dx = e.clientX - d.startX;

      // available width depends on which panels are visible
      const baseRight = d.propsOpen ? d.startRight : 0;
      const baseLeft = d.explorerOpen ? d.startLeft : 0;

      if (d.side === "left") {
        const raw = baseLeft + dx;
        const maxLeft = Math.max(
          DOCK_MIN_LEFT,
          window.innerWidth - CENTER_MIN - baseRight - DOCK_GUTTER
        );
        setDock({ left: clamp(raw, DOCK_MIN_LEFT, maxLeft) });
      }

      if (d.side === "right") {
        const raw = baseRight - dx;
        const maxRight = Math.max(
          DOCK_MIN_RIGHT,
          window.innerWidth - CENTER_MIN - baseLeft - DOCK_GUTTER
        );
        setDock({ right: clamp(raw, DOCK_MIN_RIGHT, maxRight) });
      }
    };

    const onUp = () => {
      dragRef.current = null;
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [setDock]);

  // Clamp docks on window resize so viewport never collapses
  useEffect(() => {
    const onResize = () => {
      const left = panels.explorer ? dock.left : 0;
      const right = panels.properties ? dock.right : 0;

      const maxLeft = panels.explorer
        ? Math.max(DOCK_MIN_LEFT, window.innerWidth - CENTER_MIN - right - DOCK_GUTTER)
        : 0;

      const maxRight = panels.properties
        ? Math.max(DOCK_MIN_RIGHT, window.innerWidth - CENTER_MIN - left - DOCK_GUTTER)
        : 0;

      if (panels.explorer) setDock({ left: clamp(dock.left, DOCK_MIN_LEFT, maxLeft) });
      if (panels.properties) setDock({ right: clamp(dock.right, DOCK_MIN_RIGHT, maxRight) });
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [dock.left, dock.right, panels.explorer, panels.properties, setDock]);

  // Hotkeys (guarded)
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.repeat) return;

      // If any overlay is active, don't run editor hotkeys
      if (modal?.open || menu?.open || commandBarOpen) return;

      // Never fire editor hotkeys while typing
      if (isTypingTarget(document.activeElement)) return;

      // Ctrl/Cmd shortcuts
      if (e.ctrlKey || e.metaKey) {
        const k = e.key.toLowerCase();

        if (k === "d") {
          e.preventDefault();
          duplicateSelected();
          return;
        }

        if (k === "g") {
          e.preventDefault();
          if (e.shiftKey) ungroupSelected();
          else groupSelected();
          return;
        }

        return;
      }

      const k = e.key.toLowerCase();

      // Transform
      if (k === "w") setTransformMode("translate");
      if (k === "e") setTransformMode("rotate");
      if (k === "r") setTransformMode("scale");
      if (k === "q") toggleTransformSpace();

      // Delete
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        removeSelected();
      }

      // NOTE: Shift+P is reserved for Command Bar in your app.
      // Use Shift+I to insert Part instead (no conflict).
      if (e.shiftKey && k === "i") {
        e.preventDefault();
        insert("Part");
      }

      if (e.shiftKey && k === "t") {
        e.preventDefault();
        insert("Terrain");
      }

      // Play test
      if (e.key === "F5") {
        e.preventDefault();
        if (isPlaying) stopPlay();
        else startPlay();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    modal?.open,
    menu?.open,
    commandBarOpen,
    duplicateSelected,
    groupSelected,
    ungroupSelected,
    setTransformMode,
    toggleTransformSpace,
    removeSelected,
    insert,
    isPlaying,
    startPlay,
    stopPlay,
  ]);

  // Calculate dock widths - collapse to 0 when hidden
  const leftWidth = panels.explorer ? dock.left : 0;
  const rightWidth = panels.properties ? dock.right : 0;

  return (
    <div className="dlx-app">
      <Ribbon />

      <div
        className="dlx-workspace"
        style={{
          "--dock-left": `${leftWidth}px`,
          "--dock-right": `${rightWidth}px`,
        }}
      >
        {panels.explorer && (
          <>
            <div className="dlx-panel" style={{ borderRight: "1px solid #1f2937", background: "#0f1117" }}>
              <div className="dlx-panel-header">
                <span style={{ fontWeight: 600 }}>🌳 Explorer</span>
                <button className="dlx-panel-close" onClick={() => togglePanel("explorer")} title="Close Explorer">
                  ✕
                </button>
              </div>
              <Hierarchy />
            </div>

            <div className="dlx-divider" onPointerDown={onDividerDown("left")} title="Drag to resize" />
          </>
        )}

        <div className="dlx-panel" style={{ background: "#05070d" }}>
          <SceneCanvas />
        </div>

        {panels.properties && (
          <>
            <div className="dlx-divider" onPointerDown={onDividerDown("right")} title="Drag to resize" />

            <div className="dlx-panel" style={{ borderLeft: "1px solid #1f2937", background: "#0f1117" }}>
              <div className="dlx-panel-header">
                <span style={{ fontWeight: 600 }}>⚙️ Properties</span>
                <button className="dlx-panel-close" onClick={() => togglePanel("properties")} title="Close Properties">
                  ✕
                </button>
              </div>
              <Inspector />
            </div>
          </>
        )}
      </div>

      {panels.output && (
        <div className={`dlx-output-dock ${outputCollapsed ? "collapsed" : ""}`} style={{ "--output-height": outputCollapsed ? "28px" : "160px" }}>
          <div className="dlx-output-header" onClick={() => setOutputCollapsed((v) => !v)}>
            <span>{outputCollapsed ? "▶" : "▼"}</span>
            <span>📋 Output</span>
            <div style={{ flex: 1 }} />
            <button
              className="dlx-console-close"
              onClick={(e) => {
                e.stopPropagation();
                togglePanel("output");
              }}
              title="Close Output"
            >
              ✕
            </button>
            <button
              className="dlx-console-clear"
              onClick={(e) => {
                e.stopPropagation();
                clearLogs?.();
              }}
            >
              Clear
            </button>
          </div>

          {!outputCollapsed && (
            <div className="dlx-output-body">
              <ConsolePanel />
            </div>
          )}
        </div>
      )}

      <AssetManager />
      <ContextMenu />
      <AvatarEditor />
      <CommandBar />
      <GizmoHints />
      <ScriptEditorModal />
    </div>
  );
}