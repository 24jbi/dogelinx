import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUI } from "../uiStore.js";
import { useStudio } from "../store.js";

// ===============================
// Built-in assets
// ===============================
const BUILT_IN_ASSETS = {
  models: [
    {
      id: "crate",
      name: "Wooden Crate",
      description: "Simple wooden crate model",
      preview: "📦",
      insert: () => ({ className: "Model", name: "WoodenCrate" }),
    },
    {
      id: "chair",
      name: "Chair",
      description: "Simple wooden chair",
      preview: "🪑",
      insert: () => ({ className: "Model", name: "Chair" }),
    },
    {
      id: "tree",
      name: "Tree",
      description: "Simple tree model",
      preview: "🌲",
      insert: () => ({ className: "Model", name: "Tree" }),
    },
  ],
  sounds: [
    {
      id: "beep",
      name: "Beep Sound",
      description: "Classic beep sound effect",
      preview: "🔊",
      url: "https://assets.example.com/beep.mp3",
    },
    {
      id: "bg_music",
      name: "Background Music",
      description: "Ambient background music",
      preview: "🎵",
      url: "https://assets.example.com/ambient.mp3",
    },
    {
      id: "water",
      name: "Water Splash",
      description: "Water splash sound effect",
      preview: "💦",
      url: "https://assets.example.com/splash.mp3",
    },
  ],
  images: [
    {
      id: "grass",
      name: "Grass Texture",
      description: "Grass ground texture",
      preview: "🟩",
      url: "https://assets.example.com/grass.png",
    },
    {
      id: "wood",
      name: "Wood Texture",
      description: "Wood material texture",
      preview: "🟫",
      url: "https://assets.example.com/wood.png",
    },
    {
      id: "concrete",
      name: "Concrete Texture",
      description: "Concrete wall texture",
      preview: "⬜",
      url: "https://assets.example.com/concrete.png",
    },
  ],
};

const TABS = [
  { id: "models", label: "📦 Models" },
  { id: "sounds", label: "🔊 Sounds" },
  { id: "images", label: "🖼️ Images" },
  { id: "custom", label: "🔗 Custom URL" },
];

const CUSTOM_MODE = [
  { id: "auto", label: "Auto" },
  { id: "sound", label: "Sound" },
  { id: "image", label: "Image" },
];

// ===============================
// Helpers
// ===============================
function safeTrim(s) {
  return (s ?? "").toString().trim();
}

function getLowerExtLike(url) {
  const u = safeTrim(url);
  // allow rbxassetid://123
  if (u.startsWith("rbxassetid://")) return "";
  const qLess = u.split("?")[0].split("#")[0];
  const dot = qLess.lastIndexOf(".");
  if (dot === -1) return "";
  return qLess.slice(dot).toLowerCase(); // ".png"
}

function detectUrlKind(url) {
  const ext = getLowerExtLike(url);
  if (ext === ".mp3" || ext === ".wav" || ext === ".ogg") return "sound";
  if (ext === ".png" || ext === ".jpg" || ext === ".jpeg" || ext === ".webp" || ext === ".gif") return "image";
  // If no extension, still allow (some CDNs / rbxassetid) but require user pick mode
  return "unknown";
}

function isValidAssetUrl(url) {
  const u = safeTrim(url);
  if (!u) return false;
  if (u.startsWith("rbxassetid://")) return true;
  try {
    const parsed = new URL(u);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

// ===============================
// Tiny toast (replaces alert())
// ===============================
function Toast({ toast, onClose }) {
  if (!toast) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        bottom: 14,
        background: toast.type === "error" ? "rgba(185, 28, 28, 0.25)" : "rgba(37, 99, 235, 0.25)",
        border: `1px solid ${toast.type === "error" ? "#ef4444" : "#3b82f6"}`,
        color: "#e5e7eb",
        borderRadius: 8,
        padding: "10px 12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        pointerEvents: "auto",
      }}
    >
      <div style={{ fontSize: 12, lineHeight: 1.35 }}>{toast.message}</div>
      <button
        onClick={onClose}
        style={{
          border: "1px solid #334155",
          background: "#0b1220",
          color: "#cbd5e1",
          borderRadius: 6,
          padding: "6px 10px",
          cursor: "pointer",
          fontSize: 12,
          whiteSpace: "nowrap",
        }}
      >
        OK
      </button>
    </div>
  );
}

// ===============================
// Main component
// ===============================
export default function AssetManager() {
  const modal = useUI((u) => u.modal);
  const closeModal = useUI((u) => u.closeModal);

  const insert = useStudio((s) => s.insert);
  const setProp = useStudio((s) => s.setProp);
  const primaryId = useStudio((s) => s.primaryId);
  const objects = useStudio((s) => s.objects);

  const [tab, setTab] = useState("models");
  const [query, setQuery] = useState("");

  const [customMode, setCustomMode] = useState("auto"); // auto | sound | image
  const [customUrl, setCustomUrl] = useState("");
  const [assetName, setAssetName] = useState("");

  const [toast, setToast] = useState(null);
  const closeBtnRef = useRef(null);

  const selected = useMemo(
    () => objects.find((o) => o.id === primaryId) || null,
    [objects, primaryId]
  );

  const showToast = useCallback((message, type = "info") => {
    setToast({ message, type });
    // auto-clear after a bit (still has OK button)
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 2500);
  }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  showToast._t = showToast._t || null;

  const isOpen = modal.open && modal.kind === "assets";
  useEffect(() => {
    if (!isOpen) return;

    // focus close button on open
    const t = setTimeout(() => closeBtnRef.current?.focus?.(), 0);

    const onKeyDown = (e) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, closeModal]);

  // Keep tab valid when modal opens again
  useEffect(() => {
    if (!isOpen) return;
    if (!TABS.some((t) => t.id === tab)) setTab("models");
  }, [isOpen, tab]);

  const assetsForTab = useMemo(() => {
    const list = BUILT_IN_ASSETS[tab] || [];
    const q = safeTrim(query).toLowerCase();
    if (!q) return list;
    return list.filter((a) => {
      const hay = `${a.name} ${a.description} ${a.id}`.toLowerCase();
      return hay.includes(q);
    });
  }, [tab, query]);

  const canSetImageOnSelected = useMemo(() => {
    return !!selected && (selected.className === "ImageLabel" || selected.className === "ImageButton");
  }, [selected]);

  const insertModelAsset = useCallback(
    (assetData) => {
      const payload = assetData.insert?.();
      if (!payload?.className) return showToast("This model asset is missing insert() data.", "error");

      const ok = insert(payload.className, payload.name || assetData.name || assetData.id);
      if (ok) showToast(`Inserted: ${assetData.name}`);
      else showToast("Insert failed (insert() returned false).", "error");
    },
    [insert, showToast]
  );

  const insertSoundAsset = useCallback(
    (url, name) => {
      const ok = insert("Sound");
      if (!ok) return showToast("Insert failed (Sound).", "error");

      const id = useStudio.getState().primaryId;
      if (!id) return showToast("Insert succeeded but no selected id was set.", "error");

      setProp(id, { soundUrl: url, volume: 0.5, name: name || "Sound" });
      showToast(`Sound inserted: ${name || "Sound"}`);
    },
    [insert, setProp, showToast]
  );

  const applyImageAsset = useCallback(
    (url) => {
      if (!canSetImageOnSelected) {
        return showToast("Select an ImageLabel or ImageButton first.", "error");
      }
      setProp(primaryId, { image: url });
      showToast(`Image set on ${selected?.name || "selected object"}`);
    },
    [canSetImageOnSelected, primaryId, selected, setProp, showToast]
  );

  const insertBuiltInAsset = useCallback(
    (assetData) => {
      if (assetData.insert && tab === "models") return insertModelAsset(assetData);
      if (assetData.url && tab === "sounds") return insertSoundAsset(assetData.url, assetData.name);
      if (assetData.url && tab === "images") return applyImageAsset(assetData.url);

      showToast("Unsupported asset type for this tab.", "error");
    },
    [tab, insertModelAsset, insertSoundAsset, applyImageAsset, showToast]
  );

  const insertCustom = useCallback(() => {
    const url = safeTrim(customUrl);
    const name = safeTrim(assetName);

    if (!url) return showToast("Enter a URL first.", "error");
    if (!isValidAssetUrl(url)) return showToast("That URL doesn’t look valid. Use https://... or rbxassetid://...", "error");

    const detected = detectUrlKind(url);
    const mode = customMode === "auto" ? detected : customMode;

    if (mode === "sound") {
      return insertSoundAsset(url, name || "CustomSound");
    }

    if (mode === "image") {
      return applyImageAsset(url);
    }

    // unknown in auto mode
    showToast("Couldn’t tell if that’s a sound or image. Set Custom Mode to Sound or Image.", "error");
  }, [customUrl, assetName, customMode, insertSoundAsset, applyImageAsset, showToast]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        zIndex: 9998,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
      onPointerDown={closeModal}
    >
      <div
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          width: 820,
          maxWidth: "96vw",
          maxHeight: "90vh",
          background: "#1a1f2e",
          border: "1px solid #2d3748",
          borderRadius: 10,
          padding: 16,
          color: "#cbd5e1",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 14 }}>Asset Manager</div>
          <button
            ref={closeBtnRef}
            onClick={closeModal}
            style={{
              border: "1px solid #404854",
              background: "#2d3748",
              color: "#cbd5e1",
              borderRadius: 8,
              padding: "6px 10px",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            Close
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 12,
            borderBottom: "1px solid #374151",
            paddingBottom: 10,
            flexWrap: "wrap",
          }}
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id);
                setQuery("");
              }}
              style={{
                padding: "6px 12px",
                background: tab === t.id ? "#3b82f6" : "transparent",
                color: tab === t.id ? "#fff" : "#9ca3af",
                border: "1px solid " + (tab === t.id ? "#3b82f6" : "#374151"),
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Top bar (search / selected info) */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
          {tab !== "custom" ? (
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search assets..."
              style={{
                flex: 1,
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid #404854",
                background: "#111827",
                color: "#cbd5e1",
                outline: "none",
                fontSize: 12,
              }}
            />
          ) : (
            <div style={{ flex: 1 }} />
          )}

          <div style={{ fontSize: 12, color: "#9ca3af", whiteSpace: "nowrap" }}>
            Selected:{" "}
            <span style={{ color: "#e5e7eb", fontWeight: 700 }}>
              {selected ? `${selected.name} (${selected.className})` : "None"}
            </span>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", marginBottom: 12 }}>
          {tab === "custom" ? (
            <div style={{ padding: 12 }}>
              <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 10, lineHeight: 1.35 }}>
                Paste a URL (https://... or rbxassetid://...). If auto-detect can’t tell what it is, switch mode.
              </div>

              {/* custom mode */}
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                {CUSTOM_MODE.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setCustomMode(m.id)}
                    style={{
                      padding: "6px 10px",
                      background: customMode === m.id ? "#2563eb" : "transparent",
                      color: customMode === m.id ? "#fff" : "#9ca3af",
                      border: "1px solid " + (customMode === m.id ? "#3b82f6" : "#374151"),
                      borderRadius: 8,
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                placeholder="Asset name (optional, used for sounds)"
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid #404854",
                  background: "#111827",
                  color: "#cbd5e1",
                  outline: "none",
                  fontSize: 12,
                  marginBottom: 8,
                  boxSizing: "border-box",
                }}
              />

              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://... or rbxassetid://..."
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid #404854",
                  background: "#111827",
                  color: "#cbd5e1",
                  outline: "none",
                  fontSize: 12,
                  marginBottom: 10,
                  boxSizing: "border-box",
                }}
              />

              <button
                onClick={insertCustom}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 10,
                  border: "1px solid #3b82f6",
                  background: "#2563eb",
                  color: "#fff",
                  fontWeight: 900,
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Insert
              </button>

              {/* hint */}
              <div style={{ marginTop: 10, fontSize: 11, color: "#6b7280", lineHeight: 1.35 }}>
                Tip: For images, you must select an ImageLabel/ImageButton first{" "}
                <span style={{ color: canSetImageOnSelected ? "#34d399" : "#f87171" }}>
                  ({canSetImageOnSelected ? "OK" : "not selected"})
                </span>
                .
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                gap: 12,
                padding: 12,
              }}
            >
              {assetsForTab.map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => insertBuiltInAsset(asset)}
                  style={{
                    padding: 12,
                    background: "#0f172a",
                    border: "1px solid #374151",
                    borderRadius: 10,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    userSelect: "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#3b82f6";
                    e.currentTarget.style.background = "#111f3a";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#374151";
                    e.currentTarget.style.background = "#0f172a";
                  }}
                  title="Click to insert"
                >
                  <div style={{ fontSize: 34, textAlign: "center", marginBottom: 8 }}>{asset.preview}</div>
                  <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 4 }}>{asset.name}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.35 }}>{asset.description}</div>
                </div>
              ))}

              {assetsForTab.length === 0 && (
                <div style={{ gridColumn: "1 / -1", padding: 16, color: "#9ca3af", fontSize: 12 }}>
                  No assets match your search.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            fontSize: 11,
            color: "#6b7280",
            padding: "8px 12px",
            backgroundColor: "#0f1117",
            borderRadius: 8,
            border: "1px solid #1f2937",
          }}
        >
          {tab === "models" && "Click an asset to insert a Model into Workspace"}
          {tab === "sounds" && "Click to insert a Sound (then it gets its URL + volume set)"}
          {tab === "images" && "Select an ImageLabel/ImageButton first, then click to set its image"}
          {tab === "custom" && "Paste a custom URL, pick mode if needed, then Insert"}
        </div>

        <Toast toast={toast} onClose={() => setToast(null)} />
      </div>
    </div>
  );
}