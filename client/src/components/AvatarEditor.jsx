import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { useUI } from "../uiStore.js";
import { useStudio } from "../store.js";
import supabase from "../supabaseClient.js";
import { API_BASE_URL } from "../utils/apiClient";

// ===============================
// Small toast (replaces alert())
// ===============================
function Toast({ toast, onClose }) {
  if (!toast) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 12,
        right: 12,
        bottom: 12,
        background: toast.type === "error" ? "rgba(185, 28, 28, 0.25)" : "rgba(37, 99, 235, 0.25)",
        border: `1px solid ${toast.type === "error" ? "#ef4444" : "#3b82f6"}`,
        color: "#e5e7eb",
        borderRadius: 10,
        padding: "10px 12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
      }}
    >
      <div style={{ fontSize: 12, lineHeight: 1.35 }}>{toast.message}</div>
      <button
        onClick={onClose}
        style={{
          border: "1px solid #334155",
          background: "#0b1220",
          color: "#cbd5e1",
          borderRadius: 8,
          padding: "6px 10px",
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 800,
          whiteSpace: "nowrap",
        }}
      >
        OK
      </button>
    </div>
  );
}

// ===============================
// R3F helpers (texture components)
// ===============================
function FaceSprite({ url }) {
  const tex = useLoader(THREE.TextureLoader, url);

  useMemo(() => {
    if (!tex) return;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    tex.needsUpdate = true;
  }, [tex]);

  return (
    <sprite position={[0, 1.65, 0.46]}>
      <spriteMaterial map={tex} transparent />
    </sprite>
  );
}

function HeadAccessory({ url }) {
  const tex = useLoader(THREE.TextureLoader, url);

  useMemo(() => {
    if (!tex) return;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    tex.needsUpdate = true;
  }, [tex]);

  return (
    <mesh position={[0, 1.92, 0]} rotation={[0, 0, 0]}>
      <boxGeometry args={[0.6, 0.2, 0.4]} />
      <meshStandardMaterial map={tex} transparent />
    </mesh>
  );
}

function R6Avatar({ config }) {
  const group = useRef(null);
  const t = useRef(0);

  useFrame((_, delta) => {
    t.current += delta;
    const g = group.current;
    if (!g) return;
    g.rotation.y = Math.sin(t.current * 0.5) * 0.06;
    g.position.y = 0.4 + Math.sin(t.current * 1.0) * 0.02;
  });

  const skin = config.skinColor || "#f1c27d";
  const shirt = config.shirtColor || "#2563eb";
  const pants = config.pantsColor || "#0b1220";

  return (
    <group ref={group} position={[0, 0.4, 0]}>
      {/* head */}
      <mesh position={[0, 1.6, 0]}>
        <sphereGeometry args={[0.45, 24, 16]} />
        <meshStandardMaterial color={skin} />
      </mesh>

      {/* torso */}
      <mesh position={[0, 0.85, 0]}>
        <boxGeometry args={[0.9, 1.0, 0.45]} />
        <meshStandardMaterial color={shirt} />
      </mesh>

      {/* arms */}
      <mesh position={[-0.8, 1.05, 0]}>
        <boxGeometry args={[0.3, 0.9, 0.3]} />
        <meshStandardMaterial color={skin} />
      </mesh>
      <mesh position={[0.8, 1.05, 0]}>
        <boxGeometry args={[0.3, 0.9, 0.3]} />
        <meshStandardMaterial color={skin} />
      </mesh>

      {/* legs */}
      <mesh position={[-0.25, 0.0, 0]}>
        <boxGeometry args={[0.4, 1.0, 0.4]} />
        <meshStandardMaterial color={pants} />
      </mesh>
      <mesh position={[0.25, 0.0, 0]}>
        <boxGeometry args={[0.4, 1.0, 0.4]} />
        <meshStandardMaterial color={pants} />
      </mesh>

      {/* face */}
      {config.faceUrl ? <FaceSprite url={config.faceUrl} /> : null}

      {/* accessory */}
      {config.accessoryUrl ? <HeadAccessory url={config.accessoryUrl} /> : null}
    </group>
  );
}

// ===============================
// Upload helpers
// ===============================
function safeParseJSON(s, fallback) {
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
}

function isProbablyUrl(s) {
  const v = (s || "").trim();
  if (!v) return false;
  if (v.startsWith("rbxassetid://")) return true;
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

async function uploadFileSmart({ file, folder, toast, setUploading }) {
  setUploading(true);
  try {
    // 1) Supabase storage
    if (supabase?.storage?.from) {
      const bucket = "avatars";
      const path = `${folder}/${Date.now()}_${file.name}`;

      const up = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || undefined,
      });
      if (up?.error) throw up.error;

      // Supabase v2: { data: { publicUrl } }
      const pub = supabase.storage.from(bucket).getPublicUrl(path);
      const publicUrl =
        pub?.data?.publicUrl ||
        pub?.publicURL || // older libs
        pub?.publicUrl ||
        "";

      if (publicUrl) return publicUrl;

      // if no public URL returned, fallback to local object URL
      toast("Uploaded, but no public URL returned. Using local preview instead.", "error");
      return URL.createObjectURL(file);
    }

    // 2) Local server upload fallback
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("name", `${folder}_${Date.now()}`);

      const cur = localStorage.getItem("dogelinx_currentUser");
      if (cur) {
        const parsed = safeParseJSON(cur, null);
        if (parsed?.token) fd.append("token", parsed.token);
      }

      const r = await fetch(`${API_BASE_URL}/api/avatars`, { method: "POST", body: fd });
      const j = await r.json().catch(() => null);

      if (j?.ok && j?.entry?.url) return j.entry.url;
    } catch {
      // ignore
    }

    // 3) Local preview only
    return URL.createObjectURL(file);
  } finally {
    setUploading(false);
  }
}

// ===============================
// Main component
// ===============================
export default function AvatarEditor() {
  const modal = useUI((u) => u.modal);
  const closeModal = useUI((u) => u.closeModal);

  const setPlayerAvatar = useStudio((s) => s.setPlayerAvatar);

  const [skinColor, setSkinColor] = useState("#f1c27d");
  const [shirtColor, setShirtColor] = useState("#2563eb");
  const [pantsColor, setPantsColor] = useState("#0b1220");
  const [faceUrl, setFaceUrl] = useState(null);
  const [accessoryUrl, setAccessoryUrl] = useState(null);

  const [uploadingFace, setUploadingFace] = useState(false);
  const [uploadingAcc, setUploadingAcc] = useState(false);

  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, type = "info") => {
    setToast({ message, type });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 2500);
  }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  showToast._t = showToast._t || null;

  const config = useMemo(
    () => ({ skinColor, shirtColor, pantsColor, faceUrl, accessoryUrl }),
    [skinColor, shirtColor, pantsColor, faceUrl, accessoryUrl]
  );

  const [savedAvatars, setSavedAvatars] = useState(() => {
    return safeParseJSON(localStorage.getItem("dogelinx_avatars") || "[]", []);
  });

  // refresh local avatars when modal opens
  useEffect(() => {
    if (!modal.open || modal.kind !== "avatar") return;
    setSavedAvatars(safeParseJSON(localStorage.getItem("dogelinx_avatars") || "[]", []));
  }, [modal.open, modal.kind]);

  // Escape closes
  useEffect(() => {
    if (!modal.open || modal.kind !== "avatar") return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modal.open, modal.kind, closeModal]);

  // keep store updated (so your game sees changes live)
  useEffect(() => {
    setPlayerAvatar(config);
  }, [config, setPlayerAvatar]);

  const sampleFaces = useMemo(() => ["/pictures/face1.png", "/pictures/face2.png", "/pictures/face3.png"], []);

  const applyAvatar = useCallback(
    (a) => {
      setSkinColor(a.skinColor || "#f1c27d");
      setShirtColor(a.shirtColor || "#2563eb");
      setPantsColor(a.pantsColor || "#0b1220");
      setFaceUrl(a.faceUrl || null);
      setAccessoryUrl(a.accessoryUrl || null);
      setPlayerAvatar(a);
      showToast("Applied avatar.");
    },
    [setPlayerAvatar, showToast]
  );

  const onFaceFile = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      e.target.value = ""; // allow re-upload same file
      if (!file) return;

      try {
        const url = await uploadFileSmart({
          file,
          folder: "faces",
          toast: showToast,
          setUploading: setUploadingFace,
        });
        setFaceUrl(url);
        showToast("Face updated.");
      } catch (err) {
        console.error(err);
        showToast("Face upload failed.", "error");
      }
    },
    [showToast]
  );

  const onAccessoryFile = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;

      try {
        const url = await uploadFileSmart({
          file,
          folder: "accessories",
          toast: showToast,
          setUploading: setUploadingAcc,
        });
        setAccessoryUrl(url);
        showToast("Accessory updated.");
      } catch (err) {
        console.error(err);
        showToast("Accessory upload failed.", "error");
      }
    },
    [showToast]
  );

  const saveAvatar = useCallback(async () => {
    const avatar = { ...config, createdAt: new Date().toISOString() };

    // 1) Supabase table (optional)
    try {
      if (supabase?.from) {
        const res = await supabase.from("avatars").insert([{ data: avatar }]);
        if (res?.error) throw res.error;
        showToast("Saved to cloud.");
        return;
      }
    } catch (err) {
      console.error("cloud save failed", err);
      showToast("Cloud save failed. Saved locally instead.", "error");
    }

    // 2) Local save fallback
    const arr = safeParseJSON(localStorage.getItem("dogelinx_avatars") || "[]", []);
    arr.push(avatar);
    localStorage.setItem("dogelinx_avatars", JSON.stringify(arr));
    setSavedAvatars(arr);
    showToast("Saved locally.");
  }, [config, showToast]);

  const resetAvatar = useCallback(() => {
    setSkinColor("#f1c27d");
    setShirtColor("#2563eb");
    setPantsColor("#0b1220");
    setFaceUrl(null);
    setAccessoryUrl(null);
    showToast("Reset.");
  }, [showToast]);

  const isOpen = modal.open && modal.kind === "avatar";
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
      onPointerDown={closeModal}
    >
      <div
        style={{
          width: 920,
          maxWidth: "96vw",
          display: "flex",
          gap: 12,
          background: "#1a1f2e",
          border: "1px solid #2d3748",
          borderRadius: 10,
          padding: 12,
          position: "relative",
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div style={{ width: 430, height: 540, background: "#0f1219", borderRadius: 10, padding: 8 }}>
          <Canvas camera={{ position: [0, 1.6, 3], fov: 40 }}>
            <ambientLight intensity={0.8} />
            <directionalLight position={[5, 10, 5]} intensity={1.0} />
            <R6Avatar config={config} />
          </Canvas>
        </div>

        <div style={{ flex: 1, padding: 8, color: "#cbd5e1" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <h3 style={{ margin: 0 }}>Avatar Editor</h3>
            <button
              onClick={closeModal}
              style={{
                padding: "8px 12px",
                background: "#2d3748",
                border: "1px solid #404854",
                color: "#cbd5e1",
                borderRadius: 10,
                cursor: "pointer",
                fontWeight: 800,
                fontSize: 12,
              }}
            >
              Close
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
            <label style={{ fontSize: 12 }}>
              Skin Color
              <input type="color" value={skinColor} onChange={(e) => setSkinColor(e.target.value)} style={{ marginLeft: 8 }} />
            </label>
            <label style={{ fontSize: 12 }}>
              Shirt Color
              <input type="color" value={shirtColor} onChange={(e) => setShirtColor(e.target.value)} style={{ marginLeft: 8 }} />
            </label>
            <label style={{ fontSize: 12 }}>
              Pants Color
              <input type="color" value={pantsColor} onChange={(e) => setPantsColor(e.target.value)} style={{ marginLeft: 8 }} />
            </label>
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={{ marginBottom: 6, fontSize: 12, fontWeight: 800 }}>Faces</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              {sampleFaces.map((f) => (
                <img
                  key={f}
                  src={f}
                  alt="face"
                  style={{
                    width: 56,
                    height: 56,
                    cursor: "pointer",
                    borderRadius: 10,
                    border: faceUrl === f ? "2px solid #3b82f6" : "1px solid #404854",
                  }}
                  onClick={() => setFaceUrl(f)}
                />
              ))}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <input type="file" accept="image/*" onChange={onFaceFile} />
                {uploadingFace && <div style={{ color: "#94a3b8", fontSize: 12 }}>Uploading face…</div>}
              </div>
            </div>

            <div style={{ marginTop: 8 }}>
              <input
                value={faceUrl || ""}
                onChange={(e) => setFaceUrl(e.target.value || null)}
                placeholder="Paste face URL (optional)"
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid #404854",
                  background: "#0f1219",
                  color: "#cbd5e1",
                  outline: "none",
                  fontSize: 12,
                  boxSizing: "border-box",
                }}
              />
              {faceUrl && !isProbablyUrl(faceUrl) && (
                <div style={{ marginTop: 6, color: "#fca5a5", fontSize: 12 }}>
                  That doesn’t look like a URL (try https://... or rbxassetid://...)
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={{ marginBottom: 6, fontSize: 12, fontWeight: 800 }}>Head Accessory</div>
            <input type="file" accept="image/*" onChange={onAccessoryFile} />
            {uploadingAcc && <div style={{ color: "#94a3b8", fontSize: 12 }}>Uploading accessory…</div>}

            <div style={{ marginTop: 8 }}>
              <input
                value={accessoryUrl || ""}
                onChange={(e) => setAccessoryUrl(e.target.value || null)}
                placeholder="Paste accessory URL (optional)"
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid #404854",
                  background: "#0f1219",
                  color: "#cbd5e1",
                  outline: "none",
                  fontSize: 12,
                  boxSizing: "border-box",
                }}
              />
              {accessoryUrl && !isProbablyUrl(accessoryUrl) && (
                <div style={{ marginTop: 6, color: "#fca5a5", fontSize: 12 }}>
                  That doesn’t look like a URL (try https://... or rbxassetid://...)
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={{ marginBottom: 6, fontSize: 12, fontWeight: 800 }}>Saved Avatars</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {savedAvatars.length === 0 && <div style={{ color: "#94a3b8", fontSize: 12 }}>No saved avatars</div>}
              {savedAvatars.map((s, idx) => (
                <div
                  key={idx}
                  style={{
                    width: 128,
                    padding: 8,
                    background: "#0f1219",
                    border: "1px solid #2d3748",
                    borderRadius: 10,
                  }}
                >
                  <div style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img
                      src={s.faceUrl || "/pictures/face1.png"}
                      alt="face"
                      style={{ width: 56, height: 56, borderRadius: 10 }}
                    />
                  </div>

                  <button
                    onClick={() => applyAvatar(s)}
                    style={{
                      width: "100%",
                      marginTop: 8,
                      padding: "7px 8px",
                      background: "#2563eb",
                      color: "#fff",
                      borderRadius: 10,
                      border: "1px solid #3b82f6",
                      cursor: "pointer",
                      fontWeight: 900,
                      fontSize: 12,
                    }}
                  >
                    Apply
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={saveAvatar}
              style={{
                padding: "9px 12px",
                background: "#2563eb",
                border: "1px solid #3b82f6",
                color: "#fff",
                borderRadius: 10,
                cursor: "pointer",
                fontWeight: 900,
                fontSize: 12,
              }}
            >
              Save Avatar
            </button>

            <button
              onClick={resetAvatar}
              style={{
                padding: "9px 12px",
                background: "#0f1219",
                border: "1px solid #404854",
                color: "#cbd5e1",
                borderRadius: 10,
                cursor: "pointer",
                fontWeight: 900,
                fontSize: 12,
              }}
            >
              Reset
            </button>
          </div>
        </div>

        <Toast toast={toast} onClose={() => setToast(null)} />
      </div>
    </div>
  );
}