import { create } from "zustand";
import { nanoid } from "nanoid";

// ===============================
// helpers
// ===============================
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const isVec3 = (v) => Array.isArray(v) && v.length === 3 && v.every((x) => Number.isFinite(Number(x)));
const isVec2 = (v) => Array.isArray(v) && v.length === 2 && v.every((x) => Number.isFinite(Number(x)));

// Deep clone helper (uses structuredClone if available, fallback to JSON parse/stringify)
const deepClone = (x) => {
  if (typeof structuredClone === "function") return structuredClone(x);
  return JSON.parse(JSON.stringify(x));
};

// Create a snapshot of current state (used for undo/redo)
const snapshot = (s) => ({
  objects: deepClone(s.objects),
  selectedIds: [...s.selectedIds],
  primaryId: s.primaryId,
  openScriptIds: [...(s.openScriptIds || [])],
  activeScriptId: s.activeScriptId ?? null,
});

// Resolve requested class names to internal instance class and Part shape aliases
const resolveClass = (requestedClassName) => {
  if (requestedClassName === "Cylinder") return { instanceClass: "Part", shape: "Cylinder", defaultName: "Cylinder" };
  if (requestedClassName === "Wedge") return { instanceClass: "Part", shape: "Wedge", defaultName: "Wedge" };
  if (requestedClassName === "Ball") return { instanceClass: "Part", shape: "Ball", defaultName: "Ball" };
  if (requestedClassName === "Part") return { instanceClass: "Part", shape: "Block", defaultName: "Part" };
  if (requestedClassName === "TerrainGenerator") return { instanceClass: "TerrainGenerator", shape: null, defaultName: "TerrainGenerator" };
  if (requestedClassName === "SpawnLocation") return { instanceClass: "Part", shape: "Block", defaultName: "SpawnLocation", isSpawnLocation: true };

  return { instanceClass: requestedClassName, shape: null, defaultName: requestedClassName };
};

const SERVICE_IDS = {
  Workspace: "svc_workspace",
  ReplicatedStorage: "svc_replicatedstorage",
  ServerStorage: "svc_serverstorage",
  ServerScriptService: "svc_serverscriptservice",
  StarterGui: "svc_startergui",
  StarterPack: "svc_starterpack",
  StarterPlayer: "svc_starterplayer",
  StarterPlayerScripts: "svc_starterplayerscripts",
  StarterCharacterScripts: "svc_startercharacterscripts",
  Lighting: "svc_lighting",
  SoundService: "svc_soundservice",
};

const SERVICES = [
  { id: SERVICE_IDS.Workspace, name: "📦 Workspace", className: "Workspace", parentId: null, isService: true, locked: true },
  { id: SERVICE_IDS.ReplicatedStorage, name: "💾 ReplicatedStorage", className: "ReplicatedStorage", parentId: null, isService: true, locked: true },
  { id: SERVICE_IDS.ServerStorage, name: "🔒 ServerStorage", className: "ServerStorage", parentId: null, isService: true, locked: true },
  { id: SERVICE_IDS.ServerScriptService, name: "⚙️ ServerScriptService", className: "ServerScriptService", parentId: null, isService: true, locked: true },

  { id: SERVICE_IDS.StarterGui, name: "🎨 StarterGui", className: "StarterGui", parentId: null, isService: true, locked: true },
  { id: SERVICE_IDS.StarterPack, name: "🎒 StarterPack", className: "StarterPack", parentId: null, isService: true, locked: true },

  { id: SERVICE_IDS.StarterPlayer, name: "👤 StarterPlayer", className: "StarterPlayer", parentId: null, isService: true, locked: true },
  { id: SERVICE_IDS.StarterPlayerScripts, name: "📝 StarterPlayerScripts", className: "StarterPlayerScripts", parentId: SERVICE_IDS.StarterPlayer, isService: true, locked: true },
  { id: SERVICE_IDS.StarterCharacterScripts, name: "🐢 StarterCharacterScripts", className: "StarterCharacterScripts", parentId: SERVICE_IDS.StarterPlayer, isService: true, locked: true },

  { id: SERVICE_IDS.Lighting, name: "💡 Lighting", className: "Lighting", parentId: null, isService: true, locked: true },
  { id: SERVICE_IDS.SoundService, name: "🔊 SoundService", className: "SoundService", parentId: null, isService: true, locked: true },
];

// ===============================
// Insert rules (basic Roblox-ish)
// ===============================
const ALLOWED_CHILDREN = {
  Workspace: ["Model", "Folder", "Part", "Script", "TerrainGenerator", "SpawnLocation"],
  Model: ["Model", "Folder", "Part", "Script", "LocalScript", "ModuleScript"],
  Folder: [
    "Model",
    "Folder",
    "Part",
    "Script",
    "LocalScript",
    "ModuleScript",
    "RemoteEvent",
    "RemoteFunction",
    "BindableEvent",
    "BindableFunction",
    "Sound",
    "TerrainGenerator",
    "SpawnLocation",
  ],

  // ✅ Services: strict containment rules
  ReplicatedStorage: ["Folder", "ModuleScript", "RemoteEvent", "RemoteFunction", "BindableEvent", "BindableFunction"],
  ServerStorage: ["Folder", "ModuleScript", "Script", "Model"],
  ServerScriptService: ["Folder", "ModuleScript", "Script"],

  StarterGui: ["ScreenGui", "Folder", "LocalScript", "ModuleScript"],
  ScreenGui: ["Frame", "TextLabel", "TextButton", "ImageLabel", "ImageButton", "LocalScript", "ModuleScript"],
  Frame: ["Frame", "TextLabel", "TextButton", "ImageLabel", "ImageButton", "LocalScript", "ModuleScript"],
  TextLabel: ["LocalScript", "ModuleScript"],
  TextButton: ["LocalScript", "ModuleScript"],
  ImageLabel: ["LocalScript", "ModuleScript"],
  ImageButton: ["LocalScript", "ModuleScript"],

  StarterPack: ["Tool", "Folder", "LocalScript", "ModuleScript"],
  Tool: ["Part", "LocalScript", "ModuleScript"],

  StarterPlayer: ["Folder", "LocalScript", "ModuleScript"],
  StarterPlayerScripts: ["Folder", "LocalScript", "ModuleScript"],
  StarterCharacterScripts: ["Folder", "LocalScript", "ModuleScript"],

  Lighting: ["Sky", "Folder", "ModuleScript"],
  Sky: ["LocalScript", "ModuleScript"],
  SoundService: ["Sound", "Folder", "ModuleScript"],
  Sound: ["LocalScript", "ModuleScript"],
};

export const StudioRules = { SERVICE_IDS, ALLOWED_CHILDREN };

function getClass(o) {
  return o?.className || "Folder";
}
function canParent(childClass, parentClass) {
  const allowed = ALLOWED_CHILDREN[parentClass] || [];
  return allowed.includes(childClass);
}

function ancestorsOf(id, byId) {
  const out = [];
  let cur = byId.get(id);
  while (cur?.parentId) {
    out.push(cur.parentId);
    cur = byId.get(cur.parentId);
  }
  return out;
}

// ===============================
// Default templates
// ===============================
function makeInstance(className, parentId) {
  const id = nanoid();
  const resolved = resolveClass(className);

  // ✅ All shapes are still "Part", except SpawnLocation which is special
  if (resolved.instanceClass === "Part") {
    const isPawnLoc = resolved.isSpawnLocation || false;
    return {
      id,
      name: resolved.defaultName ?? "Part",
      className: isPawnLoc ? "SpawnLocation" : "Part",
      parentId,
      position: [0, 1, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: isPawnLoc ? "#ff6b6b" : "#6ee7ff", // Red for SpawnLocation
      shape: resolved.shape ?? "Block",
      texture: "", // ✅ Initialize texture as empty string
      anchored: true,
      canCollide: true,
    };
  }

  if (resolved.instanceClass === "Model" || resolved.instanceClass === "Folder") {
    return { id, name: resolved.instanceClass, className: resolved.instanceClass, parentId };
  }

  if (resolved.instanceClass === "Script" || resolved.instanceClass === "LocalScript" || resolved.instanceClass === "ModuleScript") {
    const template =
      resolved.instanceClass === "ModuleScript"
        ? `local M = {}\n\nfunction M.init()\n\tprint("Module init")\nend\n\nreturn M\n`
        : `print("Hello from ${resolved.instanceClass}")\n`;

    return {
      id,
      name: resolved.instanceClass,
      className: resolved.instanceClass,
      parentId,
      source: template,
      disabled: false,
    };
  }

  if (
    resolved.instanceClass === "RemoteEvent" ||
    resolved.instanceClass === "RemoteFunction" ||
    resolved.instanceClass === "BindableEvent" ||
    resolved.instanceClass === "BindableFunction"
  ) {
    return { id, name: resolved.instanceClass, className: resolved.instanceClass, parentId };
  }

  if (resolved.instanceClass === "Tool") {
    return {
      id,
      name: "Tool",
      className: "Tool",
      parentId,
      handleColor: "#f97316",
    };
  }

  if (resolved.instanceClass === "ScreenGui") {
    return { id, name: "ScreenGui", className: "ScreenGui", parentId, enabled: true, resetOnSpawn: false };
  }

  if (["Frame", "TextLabel", "TextButton", "ImageLabel", "ImageButton"].includes(resolved.instanceClass)) {
    return {
      id,
      name: resolved.instanceClass,
      className: resolved.instanceClass,
      parentId,
      guiPos: [40, 40],
      guiSize: [220, 80],
      bg: "rgba(255,255,255,0.10)",
      text: resolved.instanceClass === "TextButton" ? "Button" : resolved.instanceClass === "TextLabel" ? "TextLabel" : "",
      textColor: "#e5e7eb",
      image: "",
      visible: true,
    };
  }

  if (resolved.instanceClass === "Sound") {
    return {
      id,
      name: "Sound",
      className: "Sound",
      parentId,
      soundUrl: "",
      volume: 0.5,
      looped: false,
      playing: false,
    };
  }

  if (resolved.instanceClass === "Sky") {
    return {
      id,
      name: "Sky",
      className: "Sky",
      parentId,
      topColor: "#7dd3fc",
      bottomColor: "#0b1020",
    };
  }

  if (resolved.instanceClass === "Terrain") {
    const width = 256;
    const depth = 256;
    const cellSize = 2;
    // Initialize flat heights at y=0
    const heights = new Array(width * depth).fill(0);
    return {
      id,
      name: "Terrain",
      className: "Terrain",
      parentId,
      width,
      depth,
      cellSize,
      heights, // Array of height values
      color: "#4a7c59", // Forest green
      wireframe: false,
    };
  }

  if (resolved.instanceClass === "TerrainGenerator") {
    return {
      id,
      name: "TerrainGenerator",
      className: "TerrainGenerator",
      parentId,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [10, 5, 10], // Default 20x10x20 unit box (scale 10,5,10 = 20,10,20)
      anchored: true,
      canCollide: false,
    };
  }

  return { id, name: resolved.instanceClass, className: resolved.instanceClass, parentId };
}

function makeUniqueName(objects, parentId, base) {
  const sibs = objects.filter((o) => (o.parentId ?? null) === (parentId ?? null));
  const set = new Set(sibs.map((s) => s.name));
  if (!set.has(base)) return base;
  let i = 2;
  while (set.has(`${base}${i}`)) i++;
  return `${base}${i}`;
}

function selectionRoots(selectedIds, byId) {
  const set = new Set(selectedIds);
  const roots = [];
  for (const id of selectedIds) {
    let cur = byId.get(id);
    let blocked = false;
    while (cur?.parentId) {
      if (set.has(cur.parentId)) {
        blocked = true;
        break;
      }
      cur = byId.get(cur.parentId);
    }
    if (!blocked) roots.push(id);
  }
  return roots;
}

// ===============================
// Store
// ===============================
export const useStudio = create((set, get) => {
  // ✅ Build starter GUI upfront (NO get() during init)
  const hud = { ...makeInstance("ScreenGui", SERVICE_IDS.StarterGui), name: "HUD" };
  const label = {
    ...makeInstance("TextLabel", hud.id),
    name: "Label",
    text: "DogeLinx Studio HUD",
    guiPos: [20, 16],
    guiSize: [260, 36],
    bg: "rgba(0,0,0,0.35)",
    textColor: "#e5e7eb",
    visible: true,
  };

  return {
    // DataModel
    objects: [
      ...SERVICES,

      { ...makeInstance("Sky", SERVICE_IDS.Lighting), name: "Sky", topColor: "#7dd3fc", bottomColor: "#0b1020" },

      {
        ...makeInstance("Part", SERVICE_IDS.Workspace),
        name: "Baseplate",
        position: [0, 0.5, 0],
        scale: [128, 1, 128],
        color: "#1f2937",
        anchored: true,
        canCollide: true,
        shape: "Block",
      },
      {
        ...makeInstance("Part", SERVICE_IDS.Workspace),
        name: "Part",
        position: [0, 2, 0],
        scale: [1, 1, 1],
        color: "#ffcc00",
        anchored: true,
        canCollide: true,
        shape: "Block",
      },

      { ...makeInstance("Script", SERVICE_IDS.ServerScriptService), name: "MainServer", source: `print("Server started")\n` },
      { ...makeInstance("LocalScript", SERVICE_IDS.StarterPlayerScripts), name: "MainClient", source: `print("Client started")\n` },
      { ...makeInstance("RemoteEvent", SERVICE_IDS.ReplicatedStorage), name: "TestRemote" },

      hud,
      label,
    ],

    // Selection
    selectedIds: [],
    primaryId: null,

    clearSelection: () => set({ selectedIds: [], primaryId: null }),
    selectOnly: (id) => set({ selectedIds: id ? [id] : [], primaryId: id ?? null }),
    toggleSelect: (id) =>
      set((s) => {
        const has = s.selectedIds.includes(id);
        const next = has ? s.selectedIds.filter((x) => x !== id) : [...s.selectedIds, id];
        const nextPrimary = !next.length ? null : s.primaryId && next.includes(s.primaryId) ? s.primaryId : next[0];
        return { selectedIds: next, primaryId: nextPrimary };
      }),
    setSelection: (ids, primaryId = null) => set({ selectedIds: ids, primaryId: primaryId ?? ids[0] ?? null }),
    setPrimary: (id) => set((s) => (!id || !s.selectedIds.includes(id) ? s : { primaryId: id })),

    // Transform tools
    transformMode: "translate", // "translate" | "rotate" | "scale"
    transformSpace: "world", // "world" | "local"
    setTransformMode: (mode) => set({ transformMode: mode }),
    setTransformSpace: (space) => set({ transformSpace: space }),
    toggleTransformSpace: () => set((s) => ({ transformSpace: s.transformSpace === "world" ? "local" : "world" })),
    
    // Undo/Redo history + Transactions (Studio-feel)
    history: {
      past: [],
      future: [],
      limit: 80,
    },

    _activeAction: null, // { name, before, dirty }

    // Start a grouped action (typing, drag gizmo, terrain stroke, etc)
    beginAction: (name = "Edit") => {
      set((s) => {
        if (s._activeAction) return {};
        return { _activeAction: { name, before: snapshot(s), dirty: false } };
      });
    },

    // Commit grouped action into undo stack (only if something changed)
    commitAction: () => {
      set((s) => {
        const a = s._activeAction;
        if (!a) return {};
        if (!a.dirty) return { _activeAction: null }; // no-op edits shouldn't pollute undo

        const past = [...s.history.past, a.before];
        const trimmed = past.length > s.history.limit ? past.slice(-s.history.limit) : past;

        return {
          history: { ...s.history, past: trimmed, future: [] },
          _activeAction: null,
        };
      });
    },

    // Cancel grouped action (revert to snapshot)
    cancelAction: () => {
      set((s) => {
        const a = s._activeAction;
        if (!a) return {};
        return {
          ...a.before,
          history: s.history,
          _activeAction: null,
        };
      });
    },

    // Old API — keep it, but FIX it (deep clone) + don't spam while in a transaction
    pushHistory: () => {
      set((s) => {
        if (s._activeAction) return {}; // transaction owns history
        const current = snapshot(s);
        const past = [...s.history.past, current];
        const trimmed = past.length > s.history.limit ? past.slice(-s.history.limit) : past;
        return { history: { ...s.history, past: trimmed, future: [] } };
      });
    },

    undo: () => {
      const s = get();
      if (!s.history.past.length) return;

      const past = s.history.past.slice();
      const prev = past.pop();
      const cur = snapshot(s);

      set({
        ...prev,
        history: { ...s.history, past, future: [cur, ...s.history.future] },
        _activeAction: null,
      });
    },

    redo: () => {
      const s = get();
      if (!s.history.future.length) return;

      const future = s.history.future.slice();
      const next = future.shift();
      const cur = snapshot(s);

      set({
        ...next,
        history: { ...s.history, past: [...s.history.past, cur], future },
        _activeAction: null,
      });
    },
    
    // Snapping
    snapEnabled: true,
    moveSnap: 0.5,
    rotateSnapDeg: 15,
    scaleSnap: 0.1,
    
    // === FAST transform apply (preview) ===
    applyTransformsPreview: (updates) => {
      const map = new Map(updates.map((u) => [u.id, u]));
      set((s) => ({
        objects: s.objects.map((o) => {
          const u = map.get(o.id);
          if (!u) return o;
          return {
            ...o,
            position: u.position ?? o.position,
            rotation: u.rotation ?? o.rotation,
            scale: u.scale ?? o.scale,
          };
        }),
      }));
    },

    // === COMMIT transform apply (undo snapshot ONCE) ===
    applyTransforms: (updates) => {
      get().pushHistory();
      const map = new Map(updates.map((u) => [u.id, u]));
      set((s) => ({
        objects: s.objects.map((o) => {
          const u = map.get(o.id);
          if (!u) return o;
          return {
            ...o,
            position: u.position ?? o.position,
            rotation: u.rotation ?? o.rotation,
            scale: u.scale ?? o.scale,
          };
        }),
      }));
    },

    // Script editor
    openScriptIds: [],
    activeScriptId: null,
    consoleLogs: [], // { timestamp, level ("log"|"warn"|"error"), message, source (script name) }
    openScript: (id) =>
      set((s) => ({
        openScriptIds: s.openScriptIds.includes(id) ? s.openScriptIds : [...s.openScriptIds, id],
        activeScriptId: id,
      })),
    closeScript: (id) =>
      set((s) => {
        const next = s.openScriptIds.filter((x) => x !== id);
        const active = s.activeScriptId === id ? next[next.length - 1] ?? null : s.activeScriptId;
        return { openScriptIds: next, activeScriptId: active };
      }),
    setActiveScript: (id) => set({ activeScriptId: id }),
    addLog: (level, message, source) =>
      set((s) => ({
        consoleLogs: [...s.consoleLogs, { timestamp: new Date().toLocaleTimeString(), level, message, source }],
      })),
    clearLogs: () => set({ consoleLogs: [] }),
    scriptErrors: [], // { scriptName, line, message }
    addError: (scriptName, line, message) =>
      set((s) => ({
        scriptErrors: [...s.scriptErrors, { scriptName, line, message }],
      })),
    clearErrors: () => set({ scriptErrors: [] }),
    setScriptSource: (id, source) => {
      const s = get();
      set({
        objects: s.objects.map((o) => (o.id === id ? { ...o, source } : o)),
      });
    },

    // Project Management
    projectName: "Untitled",
    projectPath: null,
    lastSaved: null,
    snapshots: [], // Array of { id, name, timestamp, objects }
    isDirty: false,

    setProjectName: (name) => set({ projectName: name }),
    setProjectPath: (path) => set({ projectPath: path }),
    setIsDirty: (dirty) => set({ isDirty: dirty }),

    createSnapshot: (snapshotName) =>
      set((s) => {
        const snapshot = {
          id: nanoid(),
          name: snapshotName || `Snapshot ${new Date().toLocaleString()}`,
          timestamp: Date.now(),
          objects: JSON.parse(JSON.stringify(s.objects)),
        };
        return {
          snapshots: [...s.snapshots, snapshot],
        };
      }),

    restoreSnapshot: (snapshotId) => {
      const s = get();
      const snapshot = s.snapshots.find((snap) => snap.id === snapshotId);
      if (!snapshot) return false;
      set({
        objects: JSON.parse(JSON.stringify(snapshot.objects)),
        selectedIds: [],
        primaryId: null,
        isDirty: true,
      });
      return true;
    },

    deleteSnapshot: (snapshotId) =>
      set((s) => ({
        snapshots: s.snapshots.filter((snap) => snap.id !== snapshotId),
      })),

    getProjectData: () => {
      const s = get();
      return {
        version: "1.0",
        projectName: s.projectName,
        objects: s.objects,
        snapshots: s.snapshots,
        exportedAt: new Date().toISOString(),
      };
    },

    // --- NO HISTORY variants (used for typing/drag preview inside beginAction/commitAction) ---
    renameNoHistory: (id, name) => {
      set((s) => ({
        _activeAction: s._activeAction ? { ...s._activeAction, dirty: true } : null,
        objects: s.objects.map((o) => {
          if (o.id !== id) return o;
          if (o.locked) return o;
          return { ...o, name };
        }),
      }));
    },

    setPropNoHistory: (id, patch) => {
      set((s) => ({
        _activeAction: s._activeAction ? { ...s._activeAction, dirty: true } : null,
        objects: s.objects.map((o) => {
          if (o.id !== id) return o;
          if (o.locked) return o;
          return { ...o, ...patch };
        }),
      }));
    },

    setVecComponentNoHistory: (id, vecName, componentIndex, value) => {
      set((s) => ({
        _activeAction: s._activeAction ? { ...s._activeAction, dirty: true } : null,
        objects: s.objects.map((o) => {
          if (o.id !== id) return o;
          if (o.locked) return o;
          const vec = Array.isArray(o[vecName]) ? [...o[vecName]] : [0, 0, 0];
          vec[componentIndex] = Number(value);
          if (!Number.isFinite(vec[componentIndex])) vec[componentIndex] = 0;
          return { ...o, [vecName]: vec };
        }),
      }));
    },

    // Rename / prop (now with transactions)
    rename: (id, name) => {
      get().beginAction("Rename");
      get().renameNoHistory(id, name);
      get().commitAction();
    },
    setProp: (id, patch) => {
      get().beginAction("Set Property");
      get().setPropNoHistory(id, patch);
      get().commitAction();
    },
    setVecComponent: (id, vecName, componentIndex, value) => {
      get().beginAction("Set Vector");
      get().setVecComponentNoHistory(id, vecName, componentIndex, value);
      get().commitAction();
    },


    // Insert helpers
    getDefaultParentFor: (className) => {
      if (className === "Script") return SERVICE_IDS.ServerScriptService;
      if (className === "LocalScript") return SERVICE_IDS.StarterPlayerScripts;
      if (className === "ModuleScript") return SERVICE_IDS.ReplicatedStorage;
      if (["RemoteEvent", "RemoteFunction", "BindableEvent", "BindableFunction"].includes(className)) return SERVICE_IDS.ReplicatedStorage;
      if (["ScreenGui", "Frame", "TextLabel", "TextButton", "ImageLabel", "ImageButton"].includes(className)) return SERVICE_IDS.StarterGui;
      if (className === "Tool") return SERVICE_IDS.StarterPack;
      if (className === "Sound") return SERVICE_IDS.SoundService;
      if (className === "Sky") return SERVICE_IDS.Lighting;
      return SERVICE_IDS.Workspace;
    },

    addInstance: (className, parentId) => {
      const { objects } = get();
      const byId = new Map(objects.map((o) => [o.id, o]));
      const parent = byId.get(parentId);
      if (!parent) return false;

      const parentClass = getClass(parent);

      // ✅ Cylinder/Wedge/Ball are treated as "Part" for rules
      const { instanceClass } = resolveClass(className);
      if (!canParent(instanceClass, parentClass)) return false;

      const inst = makeInstance(className, parentId);
      inst.name = makeUniqueName(objects, parentId, inst.name);

      get().pushHistory();
      set((s) => {
        const next = {
          objects: [...s.objects, inst],
          selectedIds: [inst.id],
          primaryId: inst.id,
        };

        if (["Script", "LocalScript", "ModuleScript"].includes(inst.className)) {
          next.openScriptIds = s.openScriptIds.includes(inst.id) ? s.openScriptIds : [...s.openScriptIds, inst.id];
          next.activeScriptId = inst.id;
        }
        return next;
      });

      return true;
    },

    insert: (className) => {
      const { objects, primaryId } = get();
      const byId = new Map(objects.map((o) => [o.id, o]));
      const selected = primaryId ? byId.get(primaryId) : null;

      const tryParents = [];
      if (selected) tryParents.push(selected.id);
      if (selected?.parentId) tryParents.push(selected.parentId);
      tryParents.push(get().getDefaultParentFor(className));

      for (const pid of tryParents) {
        const ok = get().addInstance(className, pid);
        if (ok) return true;
      }
      return false;
    },

    // Delete selection (with descendants)
    removeSelected: () => {
      const { selectedIds, objects } = get();
      if (!selectedIds.length) return;
      get().pushHistory();      const byId = new Map(objects.map((o) => [o.id, o]));
      const kill = new Set();

      const mark = (id) => {
        const o = byId.get(id);
        if (!o || o.locked) return;
        kill.add(id);
        for (const child of objects) if (child.parentId === id) mark(child.id);
      };
      for (const id of selectedIds) mark(id);

      set((s) => ({
        objects: s.objects.filter((o) => !kill.has(o.id)),
        selectedIds: [],
        primaryId: null,
        openScriptIds: s.openScriptIds.filter((id) => !kill.has(id)),
        activeScriptId: kill.has(s.activeScriptId) ? null : s.activeScriptId,
      }));
    },

    // Duplicate single instance as sibling (for context menu)
    duplicateInstance: (id) => {
      const { objects } = get();
      const byId = new Map(objects.map((o) => [o.id, o]));
      const obj = byId.get(id);
      if (!obj) return;

      get().pushHistory();

      const dup = {
        ...deepClone(obj),
        id: nanoid(),
      };
      
      // If it has position, offset it slightly
      if (Array.isArray(dup.position)) {
        dup.position = [
          dup.position[0] + 2,
          dup.position[1],
          dup.position[2],
        ];
      }

      set((s) => ({
        objects: [...s.objects, dup],
        selectedIds: [dup.id],
        primaryId: dup.id,
      }));
    },

    // Move instance to new parent (for drag-drop)
    moveInstance: (id, newParentId) => {
      const { objects } = get();
      const byId = new Map(objects.map((o) => [o.id, o]));
      const obj = byId.get(id);
      const newParent = byId.get(newParentId);

      if (!obj || !newParent || obj.locked) return false;
      if (obj.isService) return false; // Services can't be moved
      if (newParent.isService === false && newParent.locked) return false;

      // Check if newParentId is a descendant (would create cycle)
      const ancestors = ancestorsOf(id, byId);
      if (ancestors.includes(newParentId)) return false;

      // Check if parenting is allowed by rules
      const parentClass = getClass(newParent);
      const childClass = getClass(obj);
      if (!canParent(childClass, parentClass)) return false;

      get().pushHistory();

      set((s) => ({
        objects: s.objects.map((o) => (o.id === id ? { ...o, parentId: newParentId } : o)),
      }));
      return true;
    },

    // ========================
    // Play mode
    // ========================
    isPlaying: false,
    runtimeObjects: [], // Cloned objects during play mode
    runtimeRootId: null, // Root of cloned tree for reference
    playerPosition: [0, 4, 0],
    playerVelocity: [0, 0, 0],
    playerKeys: { w: false, a: false, s: false, d: false, space: false },
    playerAvatar: null,
    
    setPlayerKeys: (keys) => set({ playerKeys: keys }),
    setPlayerPosition: (pos) => set({ playerPosition: pos }),
    setPlayerVelocity: (vel) => set({ playerVelocity: vel }),
    setPlayerAvatar: (avatar) => set({ playerAvatar: avatar }),
    
    startPlay: () => {
      const { objects } = get();
      
      // Find all SpawnLocation parts
      const spawnLocations = objects.filter((o) => o.className === "SpawnLocation");
      
      // Determine spawn position
      let spawnPos = [0, 4, 0]; // Default fallback
      if (spawnLocations.length > 0) {
        // Pick random SpawnLocation
        const randomSpawn = spawnLocations[Math.floor(Math.random() * spawnLocations.length)];
        const pos = randomSpawn.position || [0, 1, 0];
        // Spawn player slightly above the SpawnLocation
        spawnPos = [pos[0], pos[1] + 2.5, pos[2]];
      } else {
        // No SpawnLocations: pick random position in the map
        const parts = objects.filter((o) => o.className === "Part" || o.className === "SpawnLocation" || o.className === "TerrainGenerator");
        if (parts.length > 0) {
          const randomPart = parts[Math.floor(Math.random() * parts.length)];
          const pos = randomPart.position || [0, 0, 0];
          spawnPos = [pos[0] + (Math.random() - 0.5) * 5, pos[1] + 3, pos[2] + (Math.random() - 0.5) * 5];
        }
      }
      
      // Deep clone all objects for runtime (so edits during play don't affect edit state)
      const runtimeClone = JSON.parse(JSON.stringify(objects));
      // Generate new IDs to avoid conflicts during play
      const idMap = new Map();
      const clonedObjects = runtimeClone.map((o) => {
        const newId = nanoid();
        idMap.set(o.id, newId);
        return { ...o, id: newId, parentId: o.parentId ? idMap.get(o.parentId) || null : null };
      });
      // Fix parent references
      const finalObjects = clonedObjects.map((o) => {
        if (o.parentId && !idMap.has(o.parentId)) {
          // Parent was in idMap, get the new ID
          const oldParentId = Object.keys(Object.fromEntries(idMap)).find(oldId => idMap.get(oldId) === o.parentId);
          if (oldParentId) return o;
          // Otherwise keep original parentId (safe fallback)
        }
        return o;
      });
      
      // Map old IDs to new IDs for final pass
      const oldToNewId = new Map(Array.from(idMap.entries()));
      const runtimeObjectsFixed = finalObjects.map((o) => ({
        ...o,
        parentId: o.parentId ? oldToNewId.get(o.parentId) || o.parentId : null,
      }));
      
      set({ 
        isPlaying: true, 
        runtimeObjects: runtimeObjectsFixed,
        runtimeRootId: runtimeObjectsFixed[0]?.id || null,
        playerPosition: spawnPos, 
        playerVelocity: [0, 0, 0] 
      });
    },
    
    stopPlay: () => set({ 
      isPlaying: false, 
      runtimeObjects: [],
      runtimeRootId: null,
      playerPosition: [0, 4, 0], 
      playerVelocity: [0, 0, 0], 
      playerKeys: { w: false, a: false, s: false, d: false, space: false } 
    }),

    togglePlay: () => {
      const isPlaying = get().isPlaying;
      if (isPlaying) {
        get().stopPlay();
      } else {
        get().startPlay();
      }
    },

    // ========================
    // Tools
    // ========================
    equippedTool: null,
    equipFirstTool: () => {
      const { objects } = get();
      const tool = objects.find((o) => o.className === "Tool");
      if (tool) set({ equippedTool: tool.id });
    },
    unequipTool: () => set({ equippedTool: null }),

    // ========================
    // Part insertion helpers
    // ========================
    addBoxAt: (pos) => {
      get().pushHistory();
      set((s) => {
        const inst = makeInstance("Part", SERVICE_IDS.Workspace);
        inst.position = pos;
        return { objects: [...s.objects, inst], selectedIds: [inst.id], primaryId: inst.id };
      });
    },

    addSphereAt: (pos) => {
      get().pushHistory();
      set((s) => {
        const inst = makeInstance("Ball", SERVICE_IDS.Workspace); // ✅ now creates className:"Part", shape:"Ball"
        inst.position = pos;
        return { objects: [...s.objects, inst], selectedIds: [inst.id], primaryId: inst.id };
      });
    },

    addPartAt: (className, pos) => {
      get().pushHistory();
      set((s) => {
        // ✅ accepts "Part" | "Ball" | "Cylinder" | "Wedge" (and anything else)
        const inst = makeInstance(className, SERVICE_IDS.Workspace);
        inst.position = pos;
        inst.name = className; // keeps your toolbar names obvious
        return { objects: [...s.objects, inst], selectedIds: [inst.id], primaryId: inst.id };
      });
    },

    // ========================
    // Grouping
    // ========================
    duplicateSelected: () => {
      const { selectedIds, objects } = get();
      if (!selectedIds.length) return;

      get().pushHistory();
      const byId = new Map(objects.map((o) => [o.id, o]));
      const idMap = new Map();

      const dupMap = new Map(
        selectedIds.map((id) => [
          id,
          {
            ...JSON.parse(JSON.stringify(byId.get(id))),
            id: nanoid(),
            position: [
              byId.get(id).position[0] + 2,
              byId.get(id).position[1],
              byId.get(id).position[2],
            ],
          },
        ])
      );

      const newObjs = Array.from(dupMap.values());
      set((s) => ({
        objects: [...s.objects, ...newObjs],
        selectedIds: newObjs.map((o) => o.id),
        primaryId: newObjs[0]?.id ?? null,
      }));
    },

    groupSelected: () => {
      const { selectedIds, objects } = get();
      if (selectedIds.length < 1) return;

      get().pushHistory();

      const groupInst = makeInstance("Model", SERVICE_IDS.Workspace);
      set((s) => {
        const updated = s.objects.map((o) =>
          selectedIds.includes(o.id) ? { ...o, parentId: groupInst.id } : o
        );
        return {
          objects: [...updated, groupInst],
          selectedIds: [groupInst.id],
          primaryId: groupInst.id,
        };
      });
    },

    ungroupSelected: () => {
      const { selectedIds, objects } = get();
      const byId = new Map(objects.map((o) => [o.id, o]));

      let propsToUngroup = [];
      for (const id of selectedIds) {
        const obj = byId.get(id);
        if (obj && obj.className === "Model") {
          const children = objects.filter((o) => o.parentId === obj.id);
          propsToUngroup.push(...children);
        }
      }

      if (!propsToUngroup.length) return;

      get().pushHistory();

      set((s) => ({
        objects: s.objects.filter((o) => !selectedIds.includes(o.id)).concat(
          s.objects
            .filter((o) => selectedIds.some((id) => o.parentId === id))
            .map((o) => ({ ...o, parentId: null }))
        ),
        selectedIds: propsToUngroup.map((o) => o.id),
        primaryId: propsToUngroup[0]?.id ?? null,
      }));
    },

    // ========================
    // Export/Import
    // ========================
    exportJSON: () => {
      const s = get();
      return JSON.stringify({
        version: "1.0",
        projectName: s.projectName,
        objects: s.objects,
        snapshots: s.snapshots,
        exportedAt: new Date().toISOString(),
      }, null, 2);
    },

    importJSON: (jsonText) => {
      try {
        const parsed = JSON.parse(jsonText);
        if (!parsed?.objects || !Array.isArray(parsed.objects)) return false;

        const migrated = parsed.objects.map((o) => {
          // Old broken format: className "Cylinder"/"Wedge"/"Ball"
          if (o?.className === "Cylinder" || o?.className === "Wedge" || o?.className === "Ball") {
            return {
              ...o,
              className: "Part",
              shape: o.className,
              position: o.position ?? [0, 1, 0],
              rotation: o.rotation ?? [0, 0, 0],
              scale: o.scale ?? [1, 1, 1],
              color: o.color ?? "#6ee7ff",
              anchored: o.anchored ?? true,
              canCollide: o.canCollide ?? true,
            };
          }

          // Ensure Parts always have a shape
          if (o?.className === "Part" && !o.shape) {
            return { ...o, shape: "Block" };
          }

          return o;
        });

        set({
          objects: migrated,
          projectName: parsed.projectName || "Imported Project",
          snapshots: parsed.snapshots || [],
          selectedIds: [],
          primaryId: null,
          openScriptIds: [],
          activeScriptId: null,
          isDirty: false,
          lastSaved: new Date(),
        });

        return true;
      } catch {
        return false;
      }
    },

    // ========================
    // BUILDER FUNCTIONS (Command Bar)
    // ========================
    makeLineOfParts: (count, spacing) => {
      get().pushHistory();
      set((s) => {
        const newObjects = [];
        for (let i = 0; i < count; i++) {
          const inst = makeInstance("Part", SERVICE_IDS.Workspace);
          inst.position = [i * spacing, 1, 0];
          inst.name = `Part_${i}`;
          newObjects.push(inst);
        }
        return { objects: [...s.objects, ...newObjects] };
      });
    },

    makeGrid: (x, z, spacing) => {
      get().pushHistory();
      set((s) => {
        const newObjects = [];
        for (let i = 0; i < x; i++) {
          for (let j = 0; j < z; j++) {
            const inst = makeInstance("Part", SERVICE_IDS.Workspace);
            inst.position = [i * spacing, 1, j * spacing];
            inst.scale = [0.8, 0.2, 0.8];
            inst.name = `GridPart_${i}_${j}`;
            newObjects.push(inst);
          }
        }
        return { objects: [...s.objects, ...newObjects] };
      });
    },

    makeCircle: (count, radius) => {
      get().pushHistory();
      set((s) => {
        const newObjects = [];
        const angleStep = (Math.PI * 2) / count;
        for (let i = 0; i < count; i++) {
          const angle = i * angleStep;
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          const inst = makeInstance("Part", SERVICE_IDS.Workspace);
          inst.position = [x, 1, z];
          inst.name = `CirclePart_${i}`;
          newObjects.push(inst);
        }
        return { objects: [...s.objects, ...newObjects] };
      });
    },

    makeStairs: (steps, rise, run, width) => {
      get().pushHistory();
      set((s) => {
        const newObjects = [];
        for (let i = 0; i < steps; i++) {
          const inst = makeInstance("Part", SERVICE_IDS.Workspace);
          inst.position = [i * run, i * rise, 0];
          inst.scale = [run, 0.2, width];
          inst.name = `Step_${i}`;
          newObjects.push(inst);
        }
        return { objects: [...s.objects, ...newObjects] };
      });
    },

    makeWall: (width, height, thickness) => {
      get().pushHistory();
      set((s) => {
        const inst = makeInstance("Part", SERVICE_IDS.Workspace);
        inst.position = [0, height / 2, 0];
        inst.scale = [width, height, thickness];
        inst.name = "Wall";
        inst.color = "#8b4513";
        return { objects: [...s.objects, inst] };
      });
    },

    makeFloor: (width, depth, thickness) => {
      get().pushHistory();
      set((s) => {
        const inst = makeInstance("Part", SERVICE_IDS.Workspace);
        inst.position = [0, 0, 0];
        inst.scale = [width, thickness, depth];
        inst.name = "Floor";
        inst.color = "#8b7355";
        inst.anchored = true;
        return { objects: [...s.objects, inst] };
      });
    },

    makeTower: (floors, radius, height) => {
      get().pushHistory();
      set((s) => {
        const newObjects = [];
        const floorHeight = height / floors;
        for (let i = 0; i < floors; i++) {
          const inst = makeInstance("Part", SERVICE_IDS.Workspace);
          inst.position = [0, i * floorHeight + floorHeight / 2, 0];
          inst.scale = [radius * 2, floorHeight * 0.8, radius * 2];
          inst.name = `Floor_${i}`;
          inst.color = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
          newObjects.push(inst);
        }
        return { objects: [...s.objects, ...newObjects] };
      });
    },

    makeObby: (difficulty) => {
      get().pushHistory();
      set((s) => {
        const newObjects = [];
        const config = {
          easy: { count: 10, spacing: 2, spread: 2 },
          medium: { count: 15, spacing: 1.5, spread: 3 },
          hard: { count: 20, spacing: 1, spread: 4 },
        };
        const cfg = config[difficulty] || config.easy;

        for (let i = 0; i < cfg.count; i++) {
          const inst = makeInstance("Part", SERVICE_IDS.Workspace);
          inst.position = [i * cfg.spacing, Math.random() * 5, Math.random() * cfg.spread - cfg.spread / 2];
          inst.scale = [1.5, 0.5, 1.5];
          inst.name = `ObbyPart_${i}`;
          inst.color = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
          newObjects.push(inst);
        }
        return { objects: [...s.objects, ...newObjects] };
      });
    },

    makeMaze: (width, height) => {
      get().pushHistory();
      set((s) => {
        const newObjects = [];
        const cellSize = 2;
        const wallThickness = 0.2;

        // Simple maze: create grid with random walls
        for (let x = 0; x < width; x++) {
          for (let z = 0; z < height; z++) {
            if (Math.random() > 0.3) {
              const inst = makeInstance("Part", SERVICE_IDS.Workspace);
              inst.position = [x * cellSize, 1, z * cellSize];
              inst.scale = [cellSize, 2, cellSize];
              inst.name = `MazeCell_${x}_${z}`;
              inst.color = "#333333";
              newObjects.push(inst);
            }
          }
        }
        return { objects: [...s.objects, ...newObjects] };
      });
    },

    makeHouse: (size) => {
      get().pushHistory();
      set((s) => {
        const newObjects = [];
        const sizeConfig = { small: 10, medium: 20, large: 30 };
        const sz = sizeConfig[size] || sizeConfig.medium;

        // Floor
        const floor = makeInstance("Part", SERVICE_IDS.Workspace);
        floor.position = [0, 0, 0];
        floor.scale = [sz, 0.5, sz];
        floor.name = "Floor";
        floor.color = "#8b7355";
        newObjects.push(floor);

        // Walls
        for (const [x, z] of [
          [sz / 2, 0],
          [-sz / 2, 0],
          [0, sz / 2],
          [0, -sz / 2],
        ]) {
          const wall = makeInstance("Part", SERVICE_IDS.Workspace);
          wall.position = [x, sz / 4, z];
          wall.scale = [sz + 1, sz / 2, 0.5];
          wall.name = "Wall";
          wall.color = "#cd853f";
          newObjects.push(wall);
        }

        // Roof
        const roof = makeInstance("Part", SERVICE_IDS.Workspace);
        roof.position = [0, sz / 2 + 0.25, 0];
        roof.scale = [sz + 1, 0.5, sz + 1];
        roof.name = "Roof";
        roof.color = "#8b4513";
        newObjects.push(roof);

        return { objects: [...s.objects, ...newObjects] };
      });
    },

    makeBridge: (length, width) => {
      get().pushHistory();
      set((s) => {
        const newObjects = [];

        // Main bridge deck
        const deck = makeInstance("Part", SERVICE_IDS.Workspace);
        deck.position = [0, 2, 0];
        deck.scale = [length, 0.5, width];
        deck.name = "BridgeDeck";
        deck.color = "#8b7355";
        newObjects.push(deck);

        // Support pillars
        for (let i = 0; i < Math.floor(length / 4); i++) {
          const pillar = makeInstance("Part", SERVICE_IDS.Workspace);
          pillar.position = [(i - Math.floor(length / 8)) * 4, 1, 0];
          pillar.scale = [0.5, 2, width + 1];
          pillar.name = `Pillar_${i}`;
          pillar.color = "#696969";
          newObjects.push(pillar);
        }

        return { objects: [...s.objects, ...newObjects] };
      });
    },

    frameAll: () => {
      // Frame all objects in view - placeholder for camera focus
      const { objects } = get();
      if (objects.length > 0) {
        // Find bounding box of all objects
        let minX = Infinity,
          maxX = -Infinity;
        let minY = Infinity,
          maxY = -Infinity;
        let minZ = Infinity,
          maxZ = -Infinity;

        for (const obj of objects) {
          if (obj.position) {
            minX = Math.min(minX, obj.position[0]);
            maxX = Math.max(maxX, obj.position[0]);
            minY = Math.min(minY, obj.position[1]);
            maxY = Math.max(maxY, obj.position[1]);
            minZ = Math.min(minZ, obj.position[2]);
            maxZ = Math.max(maxZ, obj.position[2]);
          }
        }

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const centerZ = (minZ + maxZ) / 2;

        // This would trigger camera movement in the 3D view
        // For now, just a placeholder
      }
    },

    // ========================
    // TERRAIN SYSTEM
    // ========================
    addTerrain: () => {
      const { objects } = get();
      const existing = objects.find((o) => o.className === "Terrain");
      if (existing) return existing.id;

      get().pushHistory();
      const terrain = makeInstance("Terrain", SERVICE_IDS.Workspace);
      set((s) => ({
        objects: [...s.objects, terrain],
        selectedIds: [terrain.id],
        primaryId: terrain.id,
      }));
      return terrain.id;
    },

    getTerrainHeight: (terrainId, worldX, worldZ) => {
      const { objects } = get();
      const terrain = objects.find((o) => o.id === terrainId && o.className === "Terrain");
      if (!terrain) return 0;

      const { width, depth, cellSize, heights } = terrain;
      // Convert world coords to grid indices
      const gridX = Math.floor(worldX / cellSize);
      const gridZ = Math.floor(worldZ / cellSize);

      // Clamp to bounds
      const cx = Math.max(0, Math.min(width - 1, gridX));
      const cz = Math.max(0, Math.min(depth - 1, gridZ));

      const idx = cz * width + cx;
      return heights[idx] || 0;
    },

    applyTerrainBrushNoHistory: ({ terrainId, worldPos, radius, strength, mode, targetHeight }) => {
      const { objects } = get();
      const terrain = objects.find((o) => o.id === terrainId && o.className === "Terrain");
      if (!terrain) return;

      const { width, depth, cellSize, heights: oldHeights } = terrain;
      const heights = [...oldHeights];

      const [cx, cy, cz] = worldPos;
      const centerX = Math.floor(cx / cellSize);
      const centerZ = Math.floor(cz / cellSize);
      const rCells = Math.ceil(radius / cellSize);

      const minX = Math.max(0, centerX - rCells);
      const maxX = Math.min(width - 1, centerX + rCells);
      const minZ = Math.max(0, centerZ - rCells);
      const maxZ = Math.min(depth - 1, centerZ + rCells);

      for (let x = minX; x <= maxX; x++) {
        for (let z = minZ; z <= maxZ; z++) {
          const worldX = x * cellSize;
          const worldZ = z * cellSize;
          const dist = Math.hypot(worldX - cx, worldZ - cz);
          if (dist > radius) continue;

          const idx = z * width + x;
          const falloff = Math.max(0, 1 - dist / radius);

          if (mode === "raise") heights[idx] += strength * falloff;
          else if (mode === "lower") heights[idx] -= strength * falloff;
          else if (mode === "flatten") {
            const target = targetHeight ?? cy;
            const diff = target - heights[idx];
            heights[idx] += diff * strength * falloff;
          } else if (mode === "smooth") {
            let sum = heights[idx], count = 1;
            for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
              if (dx === 0 && dz === 0) continue;
              const nx = x + dx, nz = z + dz;
              if (nx >= 0 && nx < width && nz >= 0 && nz < depth) {
                sum += heights[nz * width + nx];
                count++;
              }
            }
            const avg = sum / count;
            heights[idx] += (avg - heights[idx]) * strength * falloff;
          } else if (mode === "noise") {
            heights[idx] += ((Math.random() - 0.5) * 2 * strength) * falloff;
          }
        }
      }

      set((s) => ({
        objects: s.objects.map((o) => (o.id === terrainId ? { ...o, heights } : o)),
      }));
    },

    applyTerrainBrush: (args) => {
      get().pushHistory();
      get().applyTerrainBrushNoHistory(args);
    },
  };
});