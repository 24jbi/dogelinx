import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useStudio } from "../store.js";
import { useUI } from "../uiStore.js";
import LuaEditor from "./LuaEditor.jsx";
import MaterialSetter from "./MaterialSetter.jsx";

// ===============================
// Default values for properties
// ===============================
const PROPERTY_DEFAULTS = {
  Part: {
    position: [0, 1, 0],
    rotation: [0, 0, 0], // radians (three.js)
    scale: [1, 1, 1],
    color: "#6ee7ff",
    texture: "", // texture URL
    shape: "Block",
    anchored: true,
    canCollide: true,
  },
  Tool: {
    handleColor: "#f97316",
  },
  Sound: {
    soundUrl: "",
    volume: 0.5,
    looped: false,
    playing: false,
  },
  Sky: {
    topColor: "#7dd3fc",
    bottomColor: "#0b1020",
  },
  ScreenGui: {
    enabled: true,
  },
  Frame: {
    guiPos: [40, 40],
    guiSize: [220, 80],
    bg: "rgba(255,255,255,0.10)",
    text: "",
    textColor: "#e5e7eb",
    image: "",
    visible: true,
  },
  TextLabel: {
    guiPos: [40, 40],
    guiSize: [220, 80],
    bg: "rgba(255,255,255,0.10)",
    text: "TextLabel",
    textColor: "#e5e7eb",
    image: "",
    visible: true,
  },
  TextButton: {
    guiPos: [40, 40],
    guiSize: [220, 80],
    bg: "rgba(255,255,255,0.10)",
    text: "Button",
    textColor: "#e5e7eb",
    image: "",
    visible: true,
  },
  ImageLabel: {
    guiPos: [40, 40],
    guiSize: [220, 80],
    bg: "rgba(255,255,255,0.10)",
    text: "",
    textColor: "#e5e7eb",
    image: "",
    visible: true,
  },
  ImageButton: {
    guiPos: [40, 40],
    guiSize: [220, 80],
    bg: "rgba(255,255,255,0.10)",
    text: "",
    textColor: "#e5e7eb",
    image: "",
    visible: true,
  },
  Terrain: {
    color: "#4a7c59",
    wireframe: false,
  },
  TerrainGenerator: {
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [10, 5, 10],
    anchored: true,
    canCollide: false,
  },
  SpawnLocation: {
    position: [0, 1, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    color: "#ff6b6b",
    shape: "Block",
    anchored: true,
    canCollide: true,
  },
};

// Predefined textures for quick selection
const PREDEFINED_TEXTURES = [
  { name: "Brick", url: "https://images.unsplash.com/photo-1579403577858-f56a1409c1b8?w=256&h=256&fit=crop" },
  { name: "Wood", url: "https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?w=256&h=256&fit=crop" },
  { name: "Stone", url: "https://images.unsplash.com/photo-1578926078328-123456789?w=256&h=256&fit=crop" },
  { name: "Metal", url: "https://images.unsplash.com/photo-1578926314433-c6161687efdd?w=256&h=256&fit=crop" },
  { name: "Concrete", url: "https://images.unsplash.com/photo-1578926314433-c6161687efdd?w=256&h=256&fit=crop" },
  { name: "Glass", url: "https://images.unsplash.com/photo-1578926078328-123456789?w=256&h=256&fit=crop" },
  { name: "Carpet", url: "https://images.unsplash.com/photo-1578926078328-123456789?w=256&h=256&fit=crop" },
  { name: "Marble", url: "https://images.unsplash.com/photo-1578926078328-123456789?w=256&h=256&fit=crop" },
];

const UI = {
  panelBg: "#0f1219",
  fieldBg: "#2d3748",
  fieldBorder: "#404854",
  text: "#cbd5e1",
  subtext: "#94a3b8",
  border: "#2d3748",
  accent: "#3b82f6",
};

function clampNum(n, fallback = 0) {
  const v = Number(n);
  return Number.isFinite(v) ? v : fallback;
}

function asVecN(v, n) {
  const out = new Array(n).fill(0);
  if (!Array.isArray(v)) return out;
  for (let i = 0; i < n; i++) out[i] = clampNum(v[i], 0);
  return out;
}

function getDefault(className, key) {
  const def = PROPERTY_DEFAULTS[className] || {};
  return def[key];
}

function Category({ title, children, defaultOpen = true }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 16 }}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        style={{
          width: "100%",
          padding: "8px 0",
          background: "transparent",
          border: "none",
          borderBottom: `1px solid ${UI.border}`,
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
          color: UI.text,
          fontWeight: 700,
          fontSize: 13,
        }}
      >
        <span style={{ transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 150ms" }}>
          ▼
        </span>
        {title}
      </button>
      {isOpen && <div style={{ paddingTop: 12 }}>{children}</div>}
    </div>
  );
}

function Row({ label, children, onReset }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 700, color: UI.subtext }}>{label}</div>
        {onReset && (
          <button
            onClick={onReset}
            title="Reset to default"
            style={{
              padding: "2px 6px",
              fontSize: 11,
              background: "rgba(100,116,139,0.25)",
              color: UI.subtext,
              border: "1px solid #475569",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 800,
            }}
          >
            Reset
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, readOnly, placeholder }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      readOnly={readOnly}
      placeholder={placeholder}
      spellCheck={false}
      style={{
        width: "100%",
        padding: "8px 10px",
        background: readOnly ? "rgba(45,55,72,0.5)" : UI.fieldBg,
        color: readOnly ? "#64748b" : UI.text,
        border: `1px solid ${readOnly ? "#1e293b" : UI.fieldBorder}`,
        borderRadius: 8,
        outline: "none",
        fontSize: 13,
        cursor: readOnly ? "not-allowed" : "text",
        boxSizing: "border-box",
      }}
    />
  );
}

/**
 * DraftField:
 * - local draft while typing
 * - Enter/Blur commits (calls onCommit)
 * - Esc cancels (restores from external value)
 */
function DraftField({ value, onBegin, onCommit, onCancel, placeholder }) {
  const [draft, setDraft] = useState(value ?? "");
  const editing = useRef(false);

  useEffect(() => {
    if (!editing.current) setDraft(value ?? "");
  }, [value]);

  return (
    <input
      value={draft}
      onFocus={() => {
        editing.current = true;
        onBegin?.();
      }}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          e.preventDefault();
          editing.current = false;
          setDraft(value ?? "");
          onCancel?.();
          e.currentTarget.blur();
        }
      }}
      onBlur={() => {
        const next = draft;
        editing.current = false;
        onCommit?.(next);
      }}
      placeholder={placeholder}
      spellCheck={false}
      style={{
        width: "100%",
        padding: "8px 10px",
        background: UI.fieldBg,
        color: UI.text,
        border: `1px solid ${UI.fieldBorder}`,
        borderRadius: 8,
        outline: "none",
        fontSize: 13,
        boxSizing: "border-box",
      }}
    />
  );
}

function Checkbox({ checked, onChange }) {
  return <input type="checkbox" checked={!!checked} onChange={(e) => onChange?.(e.target.checked)} style={{ width: 18, height: 18, cursor: "pointer" }} />;
}

function ColorPicker({ value, onBegin, onCommit, onCancel, onSet }) {
  const commitTimer = useRef(null);

  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
      <input
        type="color"
        value={value || "#ffffff"}
        onPointerDown={() => onBegin?.()}
        onChange={(e) => {
          onSet?.(e.target.value);
          // color picker fires a lot — commit shortly after last change
          if (commitTimer.current) clearTimeout(commitTimer.current);
          commitTimer.current = setTimeout(() => onCommit?.(), 120);
        }}
        onBlur={() => onCommit?.()}
        style={{ width: 60, height: 36, border: "none", borderRadius: 6, cursor: "pointer" }}
      />
      <span style={{ fontSize: 12, color: UI.subtext }}>{value || "#ffffff"}</span>
      <button
        type="button"
        onClick={onCancel}
        style={{
          marginLeft: "auto",
          padding: "6px 10px",
          borderRadius: 8,
          border: "1px solid #334155",
          background: "#0b1220",
          color: UI.subtext,
          cursor: "pointer",
          fontSize: 11,
          fontWeight: 800,
        }}
        title="Cancel current edit"
      >
        Esc
      </button>
    </div>
  );
}

function TextureSelector({ value, onBegin, onCommit, onCancel, onSet }) {
  const [showPredefined, setShowPredefined] = useState(false);

  return (
    <div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
        <input
          type="text"
          value={value || ""}
          placeholder="Texture URL..."
          onFocus={() => onBegin?.()}
          onChange={(e) => onSet?.(e.target.value)}
          onBlur={() => onCommit?.()}
          style={{
            flex: 1,
            padding: "8px 10px",
            background: UI.fieldBg,
            color: UI.text,
            border: `1px solid ${UI.fieldBorder}`,
            borderRadius: 8,
            outline: "none",
            fontSize: 12,
            boxSizing: "border-box",
          }}
        />
        <button
          onClick={() => setShowPredefined(!showPredefined)}
          style={{
            padding: "8px 12px",
            background: UI.fieldBg,
            border: `1px solid ${UI.fieldBorder}`,
            borderRadius: 8,
            color: UI.text,
            cursor: "pointer",
            fontSize: 11,
            fontWeight: 600,
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "#3b4b63";
            e.target.style.borderColor = "#515b70";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = UI.fieldBg;
            e.target.style.borderColor = UI.fieldBorder;
          }}
        >
          {showPredefined ? "Hide 🎨" : "Show 🎨"}
        </button>
      </div>
      {showPredefined && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 8,
          padding: 10,
          background: "rgba(45, 55, 72, 0.3)",
          borderRadius: 8,
          marginBottom: 10,
        }}>
          {PREDEFINED_TEXTURES.map((tex) => (
            <button
              key={tex.name}
              onClick={() => {
                onSet?.(tex.url);
                onCommit?.();
                setShowPredefined(false);
              }}
              title={tex.name}
              style={{
                width: "100%",
                aspectRatio: "1",
                border: value === tex.url ? "2px solid #60a5fa" : `1px solid ${UI.fieldBorder}`,
                borderRadius: 6,
                background: `url('${tex.url}') center/cover`,
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                padding: 4,
              }}>
                <span style={{ fontSize: "10px", color: "#e5e7eb", textAlign: "center" }}>{tex.name}</span>
              </div>
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => {
          onSet?.("");
          onCommit?.();
          setShowPredefined(false);
        }}
        style={{
          padding: "6px 10px",
          background: "#1f2937",
          border: "1px solid #374151",
          borderRadius: 8,
          color: UI.subtext,
          cursor: "pointer",
          fontSize: 11,
          fontWeight: 600,
        }}
      >
        Clear Texture
      </button>
    </div>
  );
}

/**
 * VecEditor:
 * - local string drafts for X/Y(/Z)
 * - commits once (setPropNoHistory + commitAction)
 * - Esc cancels (cancelAction)
 */
function VecEditor({ n, value, labels, onBegin, onCommitVec, onCancel }) {
  const vec = asVecN(value, n);
  const [draft, setDraft] = useState(() => vec.map((x) => String(x)));
  const editing = useRef(false);

  useEffect(() => {
    if (!editing.current) setDraft(asVecN(value, n).map((x) => String(x)));
  }, [value, n]);

  const commit = () => {
    const out = draft.map((s, i) => clampNum(s, vec[i]));
    editing.current = false;
    onCommitVec?.(out);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${n}, 1fr)`, gap: 8 }}>
      {labels.slice(0, n).map((k, i) => (
        <div key={k} style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <div style={{ width: 14, opacity: 0.65, fontSize: 12, color: UI.subtext }}>{k}</div>
          <input
            value={draft[i] ?? ""}
            onFocus={() => {
              editing.current = true;
              onBegin?.();
            }}
            onChange={(e) => {
              const next = [...draft];
              next[i] = e.target.value;
              setDraft(next);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") {
                e.preventDefault();
                editing.current = false;
                setDraft(vec.map((x) => String(x)));
                onCancel?.();
                e.currentTarget.blur();
              }
            }}
            onBlur={commit}
            style={{
              width: "100%",
              padding: "6px 8px",
              background: UI.fieldBg,
              color: UI.text,
              border: `1px solid ${UI.fieldBorder}`,
              borderRadius: 8,
              outline: "none",
              fontSize: 12,
              boxSizing: "border-box",
            }}
          />
        </div>
      ))}
    </div>
  );
}

// Small debouncer for Lua source (prevents store spam)
function useDebouncedCallback(fn, delayMs) {
  const t = useRef(null);
  const last = useRef(fn);
  useEffect(() => {
    last.current = fn;
  }, [fn]);

  return useCallback(
    (...args) => {
      if (t.current) clearTimeout(t.current);
      t.current = setTimeout(() => last.current(...args), delayMs);
    },
    [delayMs]
  );
}

function TerrainBrushPanel() {
  const terrainMode = useUI((u) => u.terrainMode);
  const terrainBrushType = useUI((u) => u.terrainBrushType);
  const terrainBrushRadius = useUI((u) => u.terrainBrushRadius);
  const terrainBrushStrength = useUI((u) => u.terrainBrushStrength);
  const terrainFlattenHeight = useUI((u) => u.terrainFlattenHeight);

  const setTerrainBrushType = useUI((u) => u.setTerrainBrushType);
  const setTerrainBrushRadius = useUI((u) => u.setTerrainBrushRadius);
  const setTerrainBrushStrength = useUI((u) => u.setTerrainBrushStrength);
  const setTerrainFlattenHeight = useUI((u) => u.setTerrainFlattenHeight);

  if (!terrainMode) return null;

  return (
    <Category title="🎨 Brush Controls">
      <Row label="Brush Type">
        <select
          value={terrainBrushType}
          onChange={(e) => setTerrainBrushType(e.target.value)}
          style={{
            width: "100%",
            padding: "8px 10px",
            background: UI.fieldBg,
            color: UI.text,
            border: `1px solid ${UI.fieldBorder}`,
            borderRadius: 8,
            outline: "none",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          <option value="raise">Raise</option>
          <option value="lower">Lower</option>
          <option value="flatten">Flatten</option>
          <option value="smooth">Smooth</option>
          <option value="noise">Noise</option>
        </select>
      </Row>

      <Row label={`Radius: ${terrainBrushRadius.toFixed(1)} studs`}>
        <input type="range" min="1" max="100" step="0.5" value={terrainBrushRadius} onChange={(e) => setTerrainBrushRadius(Number(e.target.value))} style={{ width: "100%", cursor: "pointer" }} />
      </Row>

      <Row label={`Strength: ${(terrainBrushStrength * 100).toFixed(0)}%`}>
        <input type="range" min="0" max="1" step="0.05" value={terrainBrushStrength} onChange={(e) => setTerrainBrushStrength(Number(e.target.value))} style={{ width: "100%", cursor: "pointer" }} />
      </Row>

      {terrainBrushType === "flatten" && (
        <Row label="Flatten Height">
          <TextInput value={String(terrainFlattenHeight)} onChange={(v) => setTerrainFlattenHeight(Number(v) || 0)} />
        </Row>
      )}

      <div style={{ fontSize: 11, color: "#64748b", marginTop: 12, padding: 10, background: "rgba(45,55,72,0.25)", borderRadius: 10 }}>
        <div style={{ fontWeight: 900, color: UI.text, marginBottom: 6 }}>Tips</div>
        <ul style={{ margin: 0, paddingLeft: 16, lineHeight: 1.35 }}>
          <li>Left Click: Paint</li>
          <li>Shift+Click: Invert mode</li>
          <li>Ctrl+Wheel: Adjust radius</li>
        </ul>
      </div>
    </Category>
  );
}

export default function Inspector() {
  const objects = useStudio((s) => s.objects);
  const selectedIds = useStudio((s) => s.selectedIds);
  const primaryId = useStudio((s) => s.primaryId);

  const beginAction = useStudio((s) => s.beginAction);
  const commitAction = useStudio((s) => s.commitAction);
  const cancelAction = useStudio((s) => s.cancelAction);

  const renameNoHistory = useStudio((s) => s.renameNoHistory);
  const setProp = useStudio((s) => s.setProp);
  const setPropNoHistory = useStudio((s) => s.setPropNoHistory);
  const setScriptSource = useStudio((s) => s.setScriptSource);

  const openScriptEditor = useUI((u) => u.openScriptEditor);

  const primary = useMemo(() => objects.find((o) => o.id === primaryId) || null, [objects, primaryId]);

  const parentName = useMemo(() => {
    if (!primary?.parentId) return "";
    return objects.find((o) => o.id === primary.parentId)?.name || "Unknown";
  }, [primary?.parentId, objects]);

  const count = selectedIds.length;

  const resetProperty = (propKey) => {
    if (!primary) return;
    const def = getDefault(primary.className, propKey);
    if (def !== undefined) setProp(primary.id, { [propKey]: Array.isArray(def) ? [...def] : def });
  };

  const commitPatch = (label, patch) => {
    if (!primary) return;
    beginAction(label);
    setPropNoHistory(primary.id, patch);
    commitAction();
  };

  const debouncedSetSource = useDebouncedCallback((id, src) => {
    setScriptSource(id, src);
  }, 200);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          padding: "10px 12px",
          borderBottom: `1px solid ${UI.border}`,
          background: UI.panelBg,
          fontWeight: 900,
          fontSize: 13,
          color: UI.text,
        }}
      >
        Properties
      </div>

      <div style={{ 
        padding: 12, 
        overflow: "auto", 
        flex: 1,
        scrollBehavior: "smooth",
        scrollbarWidth: "thin",
        scrollbarColor: "#3b82f6 #1a1f2e"
      }}
      className="custom-scrollbar">
        {count === 0 && <div style={{ opacity: 0.7, fontSize: 13, color: UI.subtext }}>Select an object.</div>}

        {count > 1 && (
          <div style={{ opacity: 0.9, color: UI.subtext, marginBottom: 10 }}>
            Multiple selection ({count}). MVP: editing primary only.
          </div>
        )}

        {count === 1 && primary && (
          <>
            {/* ===== DATA ===== */}
            <Category title="📋 Data">
              <Row label="Name">
                <DraftField
                  value={primary.name}
                  onBegin={() => beginAction("Rename")}
                  onCommit={(v) => {
                    renameNoHistory(primary.id, v.trim() || "NewInstance");
                    commitAction();
                  }}
                  onCancel={() => cancelAction()}
                  placeholder="Name"
                />
              </Row>

              <Row label="Parent">
                <TextInput value={parentName} readOnly />
                {(primary.isService || primary.locked) && (
                  <div style={{ fontSize: 11, opacity: 0.7, marginTop: 6, color: UI.subtext }}>
                    Read-only ({primary.isService ? "service" : "locked"})
                  </div>
                )}
              </Row>

              <Row label="Class Name">
                <TextInput value={primary.className} readOnly />
              </Row>
            </Category>

            {/* ===== PART ===== */}
            {primary.className === "Part" && (
              <>
                <Category title="📐 Transform">
                  <Row label="Position" onReset={() => resetProperty("position")}>
                    <VecEditor
                      n={3}
                      labels={["X", "Y", "Z"]}
                      value={primary.position}
                      onBegin={() => beginAction("Edit Transform")}
                      onCancel={() => cancelAction()}
                      onCommitVec={(vec) => {
                        setPropNoHistory(primary.id, { position: vec });
                        commitAction();
                      }}
                    />
                  </Row>

                  <Row label="Rotation (radians)" onReset={() => resetProperty("rotation")}>
                    <VecEditor
                      n={3}
                      labels={["X", "Y", "Z"]}
                      value={primary.rotation}
                      onBegin={() => beginAction("Edit Transform")}
                      onCancel={() => cancelAction()}
                      onCommitVec={(vec) => {
                        setPropNoHistory(primary.id, { rotation: vec });
                        commitAction();
                      }}
                    />
                  </Row>

                  <Row label="Size (Scale)" onReset={() => resetProperty("scale")}>
                    <VecEditor
                      n={3}
                      labels={["X", "Y", "Z"]}
                      value={primary.scale}
                      onBegin={() => beginAction("Edit Transform")}
                      onCancel={() => cancelAction()}
                      onCommitVec={(vec) => {
                        setPropNoHistory(primary.id, { scale: vec });
                        commitAction();
                      }}
                    />
                  </Row>
                </Category>

                <Category title="🎨 Appearance">
                  <Row label="Shape" onReset={() => resetProperty("shape")}>
                    <select
                      value={primary.shape || "Block"}
                      onChange={(e) => commitPatch("Edit Appearance", { shape: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: `1px solid ${UI.fieldBorder}`,
                        background: UI.fieldBg,
                        color: UI.text,
                        outline: "none",
                        fontSize: 13,
                      }}
                    >
                      <option>Block</option>
                      <option>Ball</option>
                      <option>Cylinder</option>
                      <option>Wedge</option>
                    </select>
                  </Row>

                  <Row label="Color" onReset={() => resetProperty("color")}>
                    <ColorPicker
                      value={primary.color || "#ffffff"}
                      onBegin={() => beginAction("Edit Appearance")}
                      onCommit={() => commitAction()}
                      onCancel={() => cancelAction()}
                      onSet={(v) => setPropNoHistory(primary.id, { color: v })}
                    />
                  </Row>

                  <Row label="Texture" onReset={() => resetProperty("texture")}>
                    <TextureSelector
                      value={primary.texture || ""}
                      onBegin={() => beginAction("Edit Appearance")}
                      onCommit={() => commitAction()}
                      onCancel={() => cancelAction()}
                      onSet={(v) => setPropNoHistory(primary.id, { texture: v })}
                    />
                  </Row>

                  <div style={{ marginBottom: "12px" }}>
                    <div style={{ fontSize: "11px", fontWeight: "bold", color: "#aaa", marginBottom: "6px", textTransform: "uppercase" }}>
                      📦 Materials
                    </div>
                    <MaterialSetter />
                  </div>
                </Category>

                <Category title="⚙️ Behavior">
                  <Row label="Anchored" onReset={() => resetProperty("anchored")}>
                    <Checkbox checked={!!primary.anchored} onChange={(v) => commitPatch("Edit Behavior", { anchored: v })} />
                  </Row>

                  <Row label="Can Collide" onReset={() => resetProperty("canCollide")}>
                    <Checkbox checked={!!primary.canCollide} onChange={(v) => commitPatch("Edit Behavior", { canCollide: v })} />
                  </Row>
                </Category>
              </>
            )}

            {/* ===== SCRIPTS ===== */}
            {["Script", "LocalScript", "ModuleScript"].includes(primary.className) && (
              <Category title="📜 Script">
                <Row label="Disabled">
                  <Checkbox checked={!!primary.disabled} onChange={(v) => commitPatch("Toggle Script", { disabled: v })} />
                </Row>

                <Row label="Source">
                  <button
                    onClick={() => openScriptEditor(primary.id, primary.name)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      background: "#3b82f6",
                      border: "1px solid #2563eb",
                      borderRadius: 8,
                      color: "#fff",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 700,
                      transition: "all 150ms",
                      marginBottom: 12,
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = "#2563eb";
                      e.target.style.borderColor = "#1d4ed8";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = "#3b82f6";
                      e.target.style.borderColor = "#2563eb";
                    }}
                  >
                    📖 Open in Full Editor
                  </button>
                  <div style={{ height: 340 }}>
                    <LuaEditor
                      value={primary.source || ""}
                      onChange={(v) => debouncedSetSource(primary.id, v)}
                    />
                  </div>
                </Row>
              </Category>
            )}

            {/* ===== NETWORK OBJECTS ===== */}
            {["RemoteEvent", "RemoteFunction", "BindableEvent", "BindableFunction"].includes(primary.className) && (
              <div style={{ opacity: 0.85, fontSize: 13, color: UI.subtext }}>
                Networking object (MVP). Later: add play-test event console + fire/inspect payloads.
              </div>
            )}

            {/* ===== SOUND ===== */}
            {primary.className === "Sound" && (
              <Category title="🔊 Sound">
                <Row label="Sound URL" onReset={() => resetProperty("soundUrl")}>
                  <DraftField
                    value={primary.soundUrl || ""}
                    placeholder="https://...mp3/ogg/wav"
                    onBegin={() => beginAction("Edit Sound")}
                    onCancel={() => cancelAction()}
                    onCommit={(v) => {
                      setPropNoHistory(primary.id, { soundUrl: v });
                      commitAction();
                    }}
                  />
                </Row>

                <Row label="Volume" onReset={() => resetProperty("volume")}>
                  <DraftField
                    value={String(primary.volume ?? 0.5)}
                    onBegin={() => beginAction("Edit Sound")}
                    onCancel={() => cancelAction()}
                    onCommit={(v) => {
                      setPropNoHistory(primary.id, { volume: clampNum(v, primary.volume ?? 0.5) });
                      commitAction();
                    }}
                  />
                </Row>
              </Category>
            )}

            {/* ===== TERRAIN ===== */}
            {primary.className === "Terrain" && (
              <>
                <Category title="🗺️ Terrain">
                  <Row label="Width">
                    <TextInput value={String(primary.width || 256)} readOnly />
                  </Row>
                  <Row label="Depth">
                    <TextInput value={String(primary.depth || 256)} readOnly />
                  </Row>
                  <Row label="Cell Size">
                    <TextInput value={String(primary.cellSize || 2)} readOnly />
                  </Row>

                  <Row label="Color" onReset={() => resetProperty("color")}>
                    <ColorPicker
                      value={primary.color || "#4a7c59"}
                      onBegin={() => beginAction("Edit Terrain")}
                      onCommit={() => commitAction()}
                      onCancel={() => cancelAction()}
                      onSet={(v) => setPropNoHistory(primary.id, { color: v })}
                    />
                  </Row>

                  <Row label="Wireframe" onReset={() => resetProperty("wireframe")}>
                    <Checkbox checked={!!primary.wireframe} onChange={(v) => commitPatch("Edit Terrain", { wireframe: v })} />
                  </Row>
                </Category>

                <TerrainBrushPanel />
              </>
            )}

            {/* ===== SKY ===== */}
            {primary.className === "Sky" && (
              <Category title="🌌 Sky">
                <Row label="Top Color" onReset={() => resetProperty("topColor")}>
                  <ColorPicker
                    value={primary.topColor || "#7dd3fc"}
                    onBegin={() => beginAction("Edit Sky")}
                    onCommit={() => commitAction()}
                    onCancel={() => cancelAction()}
                    onSet={(v) => setPropNoHistory(primary.id, { topColor: v })}
                  />
                </Row>

                <Row label="Bottom Color" onReset={() => resetProperty("bottomColor")}>
                  <ColorPicker
                    value={primary.bottomColor || "#0b1020"}
                    onBegin={() => beginAction("Edit Sky")}
                    onCommit={() => commitAction()}
                    onCancel={() => cancelAction()}
                    onSet={(v) => setPropNoHistory(primary.id, { bottomColor: v })}
                  />
                </Row>
              </Category>
            )}

            {/* ===== GUI ===== */}
            {["ScreenGui", "Frame", "TextLabel", "TextButton", "ImageLabel", "ImageButton"].includes(primary.className) && (
              <Category title="🧩 GUI">
                {"enabled" in primary && (
                  <Row label="Enabled" onReset={() => resetProperty("enabled")}>
                    <Checkbox checked={!!primary.enabled} onChange={(v) => commitPatch("Edit GUI", { enabled: v })} />
                  </Row>
                )}

                {"guiPos" in primary && (
                  <Row label="GUI Position (px)" onReset={() => resetProperty("guiPos")}>
                    <VecEditor
                      n={2}
                      labels={["X", "Y"]}
                      value={primary.guiPos}
                      onBegin={() => beginAction("Edit GUI Layout")}
                      onCancel={() => cancelAction()}
                      onCommitVec={(vec) => {
                        setPropNoHistory(primary.id, { guiPos: vec });
                        commitAction();
                      }}
                    />
                  </Row>
                )}

                {"guiSize" in primary && (
                  <Row label="GUI Size (px)" onReset={() => resetProperty("guiSize")}>
                    <VecEditor
                      n={2}
                      labels={["X", "Y"]}
                      value={primary.guiSize}
                      onBegin={() => beginAction("Edit GUI Layout")}
                      onCancel={() => cancelAction()}
                      onCommitVec={(vec) => {
                        setPropNoHistory(primary.id, { guiSize: vec });
                        commitAction();
                      }}
                    />
                  </Row>
                )}

                {"bg" in primary && (
                  <Row label="Background" onReset={() => resetProperty("bg")}>
                    <DraftField
                      value={primary.bg || ""}
                      placeholder="rgba(0,0,0,0.5)"
                      onBegin={() => beginAction("Edit GUI")}
                      onCancel={() => cancelAction()}
                      onCommit={(v) => {
                        setPropNoHistory(primary.id, { bg: v });
                        commitAction();
                      }}
                    />
                  </Row>
                )}

                {"text" in primary && (
                  <Row label="Text" onReset={() => resetProperty("text")}>
                    <DraftField
                      value={primary.text || ""}
                      onBegin={() => beginAction("Edit GUI")}
                      onCancel={() => cancelAction()}
                      onCommit={(v) => {
                        setPropNoHistory(primary.id, { text: v });
                        commitAction();
                      }}
                    />
                  </Row>
                )}

                {"textColor" in primary && (
                  <Row label="Text Color" onReset={() => resetProperty("textColor")}>
                    <ColorPicker
                      value={primary.textColor || "#e5e7eb"}
                      onBegin={() => beginAction("Edit GUI")}
                      onCommit={() => commitAction()}
                      onCancel={() => cancelAction()}
                      onSet={(v) => setPropNoHistory(primary.id, { textColor: v })}
                    />
                  </Row>
                )}

                {"image" in primary && (
                  <Row label="Image URL" onReset={() => resetProperty("image")}>
                    <DraftField
                      value={primary.image || ""}
                      placeholder="https://...png/jpg"
                      onBegin={() => beginAction("Edit GUI")}
                      onCancel={() => cancelAction()}
                      onCommit={(v) => {
                        setPropNoHistory(primary.id, { image: v });
                        commitAction();
                      }}
                    />
                  </Row>
                )}
              </Category>
            )}

            {/* ===== TOOL ===== */}
            {primary.className === "Tool" && (
              <Category title="🧰 Tool">
                <Row label="Handle Color" onReset={() => resetProperty("handleColor")}>
                  <ColorPicker
                    value={primary.handleColor || "#f97316"}
                    onBegin={() => beginAction("Edit Tool")}
                    onCommit={() => commitAction()}
                    onCancel={() => cancelAction()}
                    onSet={(v) => setPropNoHistory(primary.id, { handleColor: v })}
                  />
                </Row>

                <div style={{ opacity: 0.85, fontSize: 13, color: UI.subtext }}>
                  Tool goes in <b>StarterPack</b>. Press <b>F5</b> and click “Equip Tool”.
                </div>
              </Category>
            )}
          </>
        )}
      </div>
    </div>
  );
}