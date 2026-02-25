import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStudio } from "../store.js";

export default function ProjectManager() {
  // ✅ Use selectors so this component doesn't rerender on every store change
  const projectName = useStudio((s) => s.projectName);
  const setProjectName = useStudio((s) => s.setProjectName);

  const projectPath = useStudio((s) => s.projectPath);
  const setProjectPath = useStudio((s) => s.setProjectPath);

  const isDirty = useStudio((s) => s.isDirty);
  const setIsDirty = useStudio((s) => s.setIsDirty);

  const getProjectData = useStudio((s) => s.getProjectData);
  const importJSON = useStudio((s) => s.importJSON);

  const createSnapshot = useStudio((s) => s.createSnapshot);
  const snapshots = useStudio((s) => s.snapshots || []);

  const [recentProjects, setRecentProjects] = useState([]);
  const [showProjectMenu, setShowProjectMenu] = useState(false);

  const [busy, setBusy] = useState(false);

  // autosave controls
  const autosaveTimerRef = useRef(null);
  const autosaveInFlightRef = useRef(false);

  const hasNativeAPI = !!window.dogelinx;

  const loadRecents = useCallback(async () => {
    try {
      if (!window.dogelinx?.listRecentProjects) return;
      const result = await window.dogelinx.listRecentProjects();
      if (result?.success) setRecentProjects(result.projects || []);
    } catch (e) {
      console.error("[ProjectManager] listRecentProjects failed:", e);
    }
  }, []);

  // ✅ Load recent projects on mount
  useEffect(() => {
    loadRecents();
  }, [loadRecents]);

  // ✅ Close menu on outside click + Escape
  useEffect(() => {
    if (!showProjectMenu) return;

    const onDown = (e) => {
      // if click is outside the menu container, close
      const menuEl = document.getElementById("dlx-project-menu");
      if (!menuEl) return setShowProjectMenu(false);
      if (!menuEl.contains(e.target)) setShowProjectMenu(false);
    };

    const onKey = (e) => {
      if (e.key === "Escape") setShowProjectMenu(false);
    };

    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [showProjectMenu]);

  // ✅ Warn on tab close if dirty
  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  const safeSave = useCallback(
    async ({ silent = false } = {}) => {
      if (!window.dogelinx?.saveProject) {
        if (!silent) alert("Save API not available (window.dogelinx.saveProject missing).");
        return { success: false, error: "NO_API" };
      }

      const data = getProjectData();

      // NOTE: we keep your API call shape.
      // If your preload supports saving to an existing path, you can update preload to accept (data, { filePath, silent }).
      let result;
      try {
        result = await window.dogelinx.saveProject(data, { filePath: projectPath || null, silent });
      } catch (e) {
        // Some preload functions won't accept a second arg — fallback
        result = await window.dogelinx.saveProject(data);
      }

      if (result?.success) {
        if (result.filePath) setProjectPath(result.filePath);
        setIsDirty(false);
      }

      return result || { success: false, error: "UNKNOWN" };
    },
    [getProjectData, projectPath, setIsDirty, setProjectPath]
  );

  // ✅ Debounced autosave (only when dirty AND already has a path)
  useEffect(() => {
    // only autosave if we already have a path (no popups)
    if (!isDirty || !projectPath) return;

    // clear previous schedule
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

    autosaveTimerRef.current = setTimeout(async () => {
      if (autosaveInFlightRef.current) return;
      autosaveInFlightRef.current = true;

      try {
        const res = await safeSave({ silent: true });
        if (res?.success) {
          console.log("[AutoSave] Saved:", res.filePath || projectPath);
        } else {
          console.warn("[AutoSave] Failed:", res?.error || res?.message);
        }
      } catch (e) {
        console.error("[AutoSave] Error:", e);
      } finally {
        autosaveInFlightRef.current = false;
      }
    }, 30000);

    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    };
  }, [isDirty, projectPath, safeSave]);

  const saveProject = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await safeSave({ silent: false });

      if (res?.success) {
        // Create auto-backup snapshot
        createSnapshot?.(`Auto-backup at ${new Date().toLocaleTimeString()}`);
        loadRecents();
        alert(`Project saved to:\n${res.filePath || projectPath || "(unknown path)"}`);
      } else {
        alert(`Error saving project: ${res?.error || res?.message || "Unknown error"}`);
      }
    } catch (e) {
      alert(`Save error: ${e?.message || String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  const exportProject = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const data = getProjectData();
      if (!window.dogelinx?.exportProject) {
        alert("Export API not available (window.dogelinx.exportProject missing).");
        return;
      }
      const res = await window.dogelinx.exportProject(data, `${projectName || "Untitled"}.dlxplace`);
      if (res?.success) alert(`Project exported to:\n${res.filePath}`);
      else alert(`Export error: ${res?.error || res?.message || "Unknown error"}`);
    } catch (e) {
      alert(`Export error: ${e?.message || String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  const loadProject = async (filePath) => {
    if (busy) return;
    setBusy(true);
    try {
      if (!window.dogelinx?.loadProject) {
        alert("Load API not available (window.dogelinx.loadProject missing).");
        return;
      }
      const res = await window.dogelinx.loadProject(filePath);
      if (res?.success) {
        importJSON(JSON.stringify(res.data));
        setProjectPath(res.filePath || filePath);
        setProjectName(res.data?.projectName || "Untitled");
        setIsDirty(false);
        setShowProjectMenu(false);
        loadRecents();
        alert(`Project loaded: ${res.data?.projectName || "Untitled"}`);
      } else {
        alert(`Load error: ${res?.error || res?.message || "Unknown error"}`);
      }
    } catch (e) {
      alert(`Load error: ${e?.message || String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  const openProjectDialog = async () => {
    try {
      if (!window.dogelinx?.openProjectDialog) {
        alert("Open dialog API not available (window.dogelinx.openProjectDialog missing).");
        return;
      }
      const res = await window.dogelinx.openProjectDialog();
      if (res?.success && res.filePath) await loadProject(res.filePath);
    } catch (e) {
      alert(`Error opening project dialog: ${e?.message || String(e)}`);
    }
  };

  const deleteRecentProject = async (filePath) => {
    if (!confirm("Delete this recent project?")) return;

    try {
      if (window.dogelinx?.deleteProject) {
        const res = await window.dogelinx.deleteProject(filePath);
        if (!res?.success) {
          alert(`Delete error: ${res?.error || res?.message || "Unknown error"}`);
          return;
        }
      }
      // Even if there's no delete API, remove from recents list
      setRecentProjects((prev) => prev.filter((p) => p.filePath !== filePath));
    } catch (e) {
      alert(`Error deleting project: ${e?.message || String(e)}`);
    }
  };

  const renameProject = () => {
    const newName = prompt("Enter new project name:", projectName || "Untitled");
    if (newName && newName.trim()) {
      setProjectName(newName.trim());
      setIsDirty(true);
    }
  };

  const dirtyDot = isDirty ? " •" : "";

  return (
    <div className="project-manager">
      <div
        className="dlx-btn-group"
        style={{ display: "flex", gap: "8px", alignItems: "center", padding: "4px 8px" }}
      >
        {/* Project Name Display */}
        <div
          style={{
            fontSize: "12px",
            color: "#9ca3af",
            maxWidth: "170px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            cursor: "pointer",
            padding: "4px",
          }}
          onClick={renameProject}
          title={`${projectName || "Untitled"}${isDirty ? " (unsaved)" : ""}\n${projectPath || ""}`}
        >
          {projectName || "Untitled"}
          {dirtyDot}
        </div>

        {/* Project Menu Button */}
        <div style={{ position: "relative" }}>
          <button
            className="dlx-btn"
            onClick={() => setShowProjectMenu((v) => !v)}
            style={{ fontSize: "11px", padding: "4px 8px", opacity: busy ? 0.65 : 1 }}
            disabled={busy}
            title={hasNativeAPI ? "Project actions" : "Desktop API missing (window.dogelinx)"}
          >
            ⚙️ Project
          </button>

          {showProjectMenu && (
            <div
              id="dlx-project-menu"
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "4px",
                minWidth: "180px",
                zIndex: 1000,
                marginTop: "2px",
                boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
                overflow: "hidden",
              }}
            >
              <MenuButton onClick={saveProject} label="💾 Save Project" />
              <MenuButton onClick={exportProject} label="📤 Export As..." />
              <MenuButton onClick={openProjectDialog} label="📂 Open Project..." />

              {/* Recent Projects */}
              {recentProjects.length > 0 && (
                <>
                  <MenuHeader text="Recent" />
                  {recentProjects.slice(0, 6).map((proj) => (
                    <div
                      key={proj.filePath}
                      style={{
                        padding: "6px 10px",
                        fontSize: "11px",
                        color: "#e5e7eb",
                        borderBottom: "1px solid #2d3748",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 8,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#374151")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <button
                        onClick={() => loadProject(proj.filePath)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#a8dadc",
                          cursor: "pointer",
                          fontSize: "11px",
                          textAlign: "left",
                          flex: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={proj.filePath}
                      >
                        {(proj.name || "Project").substring(0, 28)}
                      </button>
                      <button
                        onClick={() => deleteRecentProject(proj.filePath)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#ef5350",
                          cursor: "pointer",
                          fontSize: "10px",
                          paddingLeft: "4px",
                        }}
                        title="Delete"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </>
              )}

              {/* Snapshots */}
              {snapshots.length > 0 && (
                <>
                  <MenuHeader text={`Snapshots (${snapshots.length})`} />
                  <MenuButton
                    onClick={() => alert("Snapshot browser coming soon!")}
                    label="📸 View Version History"
                    noBorder
                  />
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MenuHeader({ text }) {
  return (
    <div
      style={{
        padding: "6px 10px",
        fontSize: "11px",
        color: "#6b7280",
        borderTop: "1px solid #374151",
        borderBottom: "1px solid #374151",
        fontWeight: "bold",
      }}
    >
      {text}
    </div>
  );
}

function MenuButton({ onClick, label, noBorder = false }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "8px 12px",
        background: "none",
        border: "none",
        color: "#e5e7eb",
        cursor: "pointer",
        fontSize: "12px",
        borderBottom: noBorder ? "none" : "1px solid #374151",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#374151")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
    >
      {label}
    </button>
  );
}