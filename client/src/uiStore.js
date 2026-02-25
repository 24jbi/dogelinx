import { create } from "zustand";

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

export const useUI = create((set) => ({
  dock: { left: 300, right: 340 },
  setDock: (patch) =>
    set((s) => ({
      dock: {
        left: clamp(patch.left ?? s.dock.left, 220, 560),
        right: clamp(patch.right ?? s.dock.right, 260, 700),
      },
    })),

  menu: { open: false, x: 0, y: 0, items: [] },
  openMenu: (x, y, items) => set({ menu: { open: true, x, y, items: items || [] } }),
  closeMenu: () => set((s) => ({ menu: { ...s.menu, open: false } })),

  // simple modal (asset manager)
  modal: { open: false, kind: null },
  openModal: (kind) => set({ modal: { open: true, kind } }),
  closeModal: () => set({ modal: { open: false, kind: null } }),

  // ribbon state
  activeRibbonTab: "home",
  setActiveRibbonTab: (tab) => set({ activeRibbonTab: tab }),

  // active tool state (fixes auto-selection)
  activeTool: "select",
  setActiveTool: (tool) => set({ activeTool: tool }),

  // panel visibility state (dockable panels)
  panels: { explorer: true, properties: true, output: true },
  togglePanel: (key) =>
    set((s) => ({
      panels: { ...s.panels, [key]: !s.panels[key] },
    })),
  setPanel: (key, value) =>
    set((s) => ({
      panels: { ...s.panels, [key]: value },
    })),

  // command bar state
  commandBarOpen: false,
  setCommandBarOpen: (open) => set({ commandBarOpen: open }),

  // command history + search index
  commandHistory: [], // Array of executed command strings
  addCommandToHistory: (cmd) =>
    set((s) => {
      const deduped = s.commandHistory.filter((c) => c !== cmd);
      const newHistory = [cmd, ...deduped].slice(0, 100); // Keep last 100
      return { commandHistory: newHistory };
    }),
  clearCommandHistory: () => set({ commandHistory: [] }),
  commandHistoryIndex: -1, // -1 = not browsing, 0+ = index in history
  setCommandHistoryIndex: (idx) => set({ commandHistoryIndex: idx }),

  // terrain state
  terrainMode: false,
  setTerrainMode: (mode) => set({ terrainMode: mode }),
  terrainBrushType: "raise", // raise | lower | flatten | smooth | noise
  setTerrainBrushType: (type) => set({ terrainBrushType: type }),
  terrainBrushRadius: 10,
  setTerrainBrushRadius: (radius) => set({ terrainBrushRadius: Math.max(1, radius) }),
  terrainBrushStrength: 0.5,
  setTerrainBrushStrength: (strength) => set({ terrainBrushStrength: Math.max(0, Math.min(1, strength)) }),
  terrainFlattenHeight: 0,
  setTerrainFlattenHeight: (height) => set({ terrainFlattenHeight: height }),

  // script editor modal state
  scriptEditorModal: { open: false, scriptId: null, scriptName: "" },
  openScriptEditor: (scriptId, scriptName) => set({ scriptEditorModal: { open: true, scriptId, scriptName } }),
  closeScriptEditor: () => set({ scriptEditorModal: { open: false, scriptId: null, scriptName: "" } }),
  // gizmo hints visibility
  gizmoHintsVisible: true,
  setGizmoHintsVisible: (visible) => set({ gizmoHintsVisible: visible }),
  
  // grid visibility
  gridVisible: false,
  setGridVisible: (visible) => set({ gridVisible: visible }),
}));