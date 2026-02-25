import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { TransformControls, Grid, Environment, Edges, useTexture } from "@react-three/drei";

import { useStudio } from "../store.js";
import { useUI } from "../uiStore.js";
import StudioCameraControls from "./StudioCameraControls.jsx";
import TerrainGeneratorMesh from "./TerrainGeneratorMesh.jsx";
import { createR6Rig, HumanoidController, CharacterAppearance } from "../R6Rig.js";
import PlaytestR6Character from "./PlaytestR6Character.jsx";
import { PlaytestAvatarUI } from "./PlaytestAvatarUI.jsx";
import PlaytestingSystem from "./PlaytestingSystem.jsx";

function safeVec3(v, fallback) {
  return Array.isArray(v) && v.length === 3 ? v : fallback;
}

// Material component that handles texture loading
function PartMaterial({ color, textureUrl, isSelected, isPrimary, isHovered }) {
  const materialRef = useRef();
  const textureRef = useRef();
  const [texture, setTexture] = useState(null);

  // Load texture when URL changes
  useEffect(() => {
    if (!textureUrl) {
      setTexture(null);
      return;
    }

    let canceled = false;
    const loader = new THREE.TextureLoader();
    
    loader.load(
      textureUrl,
      (tex) => {
        if (!canceled) {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = 4;
          setTexture(tex);
        }
      },
      undefined,
      (err) => {
        if (!canceled) {
          console.warn("Failed to load texture:", textureUrl, err);
          setTexture(null);
        }
      }
    );

    return () => { canceled = true; };
  }, [textureUrl]);

  // Update material when texture changes
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.map = texture;
      materialRef.current.needsUpdate = true;
    }
  }, [texture]);

  return (
    <meshStandardMaterial
      ref={materialRef}
      color={color || "#ffffff"}
      emissive={isPrimary ? "#60a5fa" : isSelected ? "#3b82f6" : isHovered ? "#1e40af" : "#000000"}
      emissiveIntensity={isPrimary ? 0.4 : isSelected ? 0.2 : isHovered ? 0.15 : 0}
      toneMapped={true}
    />
  );
}

function composeMatrix(position, rotation, scale) {
  const p = safeVec3(position, [0, 0, 0]);
  const r = safeVec3(rotation, [0, 0, 0]);
  const s = safeVec3(scale, [1, 1, 1]);

  const pos = new THREE.Vector3(p[0], p[1], p[2]);
  const eul = new THREE.Euler(r[0], r[1], r[2], "XYZ");
  const quat = new THREE.Quaternion().setFromEuler(eul);
  const scl = new THREE.Vector3(s[0], s[1], s[2]);

  const m = new THREE.Matrix4();
  m.compose(pos, quat, scl);
  return m;
}

function decomposeMatrix(m) {
  const pos = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const scl = new THREE.Vector3();
  m.decompose(pos, quat, scl);
  const eul = new THREE.Euler().setFromQuaternion(quat, "XYZ");
  return {
    position: [pos.x, pos.y, pos.z],
    rotation: [eul.x, eul.y, eul.z],
    scale: [scl.x, scl.y, scl.z],
  };
}

function hasTRS(o) {
  return Array.isArray(o?.position) && Array.isArray(o?.rotation) && Array.isArray(o?.scale);
}

function getWorldMatrix(id, byId, memo) {
  if (memo.has(id)) return memo.get(id);
  const o = byId.get(id);
  const I = new THREE.Matrix4();

  if (!o) {
    memo.set(id, I);
    return I;
  }

  const local = hasTRS(o) ? composeMatrix(o.position, o.rotation, o.scale) : I;

  if (!o.parentId) {
    memo.set(id, local);
    return local;
  }

  const pw = getWorldMatrix(o.parentId, byId, memo);
  const w = new THREE.Matrix4().multiplyMatrices(pw, local);
  memo.set(id, w);
  return w;
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

function PartMesh({ obj, worldTRS, isSelected, isPrimary, onPick, isHovered, isDraggingGizmo }) {
  if (!worldTRS) return null;
  const { position, rotation, scale } = worldTRS;

  const shape = obj.shape || "Block";
  const isHighlighted = isPrimary || isSelected || isHovered;
  const pointerDownRef = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e) => {
    e.stopPropagation();
    pointerDownRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e) => {
    e.stopPropagation();
    // Only select if pointer moved less than 3px (click, not drag)
    // AND gizmo is not being dragged
    if (!isDraggingGizmo) {
      const dx = Math.abs(e.clientX - pointerDownRef.current.x);
      const dy = Math.abs(e.clientY - pointerDownRef.current.y);
      if (dx < 3 && dy < 3) {
        onPick(e);
      }
    }
  };

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerEnter={() => onPick?.({ isHover: true, id: obj.id })}
        onPointerLeave={() => onPick?.({ isHover: false, id: obj.id })}
        castShadow
        receiveShadow
      >
        {/* Shape geometry */}
        {shape === "Ball" ? (
          <sphereGeometry args={[0.5, 28, 14]} />
        ) : shape === "Cylinder" ? (
          <cylinderGeometry args={[0.5, 0.5, 1, 18]} />
        ) : shape === "Wedge" ? (
          <coneGeometry args={[0.7, 1, 4]} />
        ) : (
          <boxGeometry args={[1, 1, 1]} />
        )}

        {/* Material with selection highlight */}
        <PartMaterial
          color={obj.color || "#ffffff"}
          textureUrl={obj.texture}
          isSelected={isSelected}
          isPrimary={isPrimary}
          isHovered={isHovered}
        />
      </mesh>

      {/* Outline for selected */}
      {isSelected && (
        <mesh>
          {shape === "Ball" ? (
            <sphereGeometry args={[0.52, 28, 14]} />
          ) : shape === "Cylinder" ? (
            <cylinderGeometry args={[0.52, 0.52, 1.04, 18]} />
          ) : shape === "Wedge" ? (
            <coneGeometry args={[0.72, 1.04, 4]} />
          ) : (
            <boxGeometry args={[1.04, 1.04, 1.04]} />
          )}
          <meshBasicMaterial color="#3b82f6" wireframe polygonOffset polygonOffsetUnits={-1} />
        </mesh>
      )}

      {/* Thicker outline for primary */}
      {isPrimary && (
        <mesh>
          {shape === "Ball" ? (
            <sphereGeometry args={[0.54, 28, 14]} />
          ) : shape === "Cylinder" ? (
            <cylinderGeometry args={[0.54, 0.54, 1.08, 18]} />
          ) : shape === "Wedge" ? (
            <coneGeometry args={[0.74, 1.08, 4]} />
          ) : (
            <boxGeometry args={[1.08, 1.08, 1.08]} />
          )}
          <meshBasicMaterial color="#60a5fa" wireframe polygonOffset polygonOffsetUnits={-2} />
        </mesh>
      )}
    </group>
  );
}

// TerrainMesh - Heightmap-based terrain rendering
function TerrainMesh({ terrain, isSelected, isPrimary, onPick, isDraggingGizmo }) {
  const meshRef = useRef();
  const geometryRef = useRef();
  const pointerDownRef = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e) => {
    e.stopPropagation();
    pointerDownRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e) => {
    e.stopPropagation();
    // Only select if pointer moved less than 3px (click, not drag)
    // AND gizmo is not being dragged
    if (!isDraggingGizmo) {
      const dx = Math.abs(e.clientX - pointerDownRef.current.x);
      const dy = Math.abs(e.clientY - pointerDownRef.current.y);
      if (dx < 3 && dy < 3) {
        onPick?.(e);
      }
    }
  };

  // Generate mesh geometry from heightmap
  const geometry = useMemo(() => {
    if (!terrain || !Array.isArray(terrain.heights)) return null;

    const { width, depth, cellSize, heights } = terrain;
    const geo = new THREE.BufferGeometry();

    // Create vertices from heightmap
    const positions = [];
    for (let z = 0; z < depth; z++) {
      for (let x = 0; x < width; x++) {
        const idx = z * width + x;
        positions.push(x * cellSize, heights[idx] || 0, z * cellSize);
      }
    }

    // Create indices for faces
    const indices = [];
    for (let z = 0; z < depth - 1; z++) {
      for (let x = 0; x < width - 1; x++) {
        const a = z * width + x;
        const b = z * width + (x + 1);
        const c = (z + 1) * width + x;
        const d = (z + 1) * width + (x + 1);

        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }

    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
    geo.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
    geo.computeVertexNormals();
    geo.computeBoundingBox();

    return geo;
  }, [terrain]);

  if (!geometry) return null;

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      castShadow
      receiveShadow
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <meshStandardMaterial
        color={terrain.color || "#4a7c59"}
        wireframe={terrain.wireframe || false}
        emissive={isPrimary ? "#60a5fa" : isSelected ? "#3b82f6" : "#000000"}
        emissiveIntensity={isPrimary ? 0.3 : isSelected ? 0.15 : 0}
      />
      {isSelected && (
        <meshBasicMaterial
          color="#3b82f6"
          wireframe
          polygonOffset
          polygonOffsetUnits={-1}
          attach="material-1"
        />
      )}
    </mesh>
  );
}

export default function SceneCanvas() {
  const clearSelection = useStudio((s) => s.clearSelection);
  const isPlaying = useStudio((s) => s.isPlaying);

  return (
    <div style={{ height: "100%", position: "relative" }}>
      <div style={{ padding: 12, borderBottom: "1px solid #2d3748", fontWeight: 700, fontSize: "13px", color: "#cbd5e1", background: "#0f1219" }}>
        🎮 Viewport
        <span style={{ marginLeft: 10, fontSize: 11, opacity: 0.55 }}>(RMB menu soon • ALT orbit)</span>
      </div>

      <div style={{ height: "calc(100% - 49px)" }}>
        <Canvas
          shadows
          camera={{ position: [8, 6, 10], fov: 50 }}
          onCreated={({ gl }) => {
            gl.shadowMap.enabled = true;
            gl.shadowMap.type = THREE.PCFShadowMap;
          }}
          onPointerMissed={(e) => {
            if (e.button !== 0) return;
            if (isPlaying) return; // Don't edit during playtest
            clearSelection();
          }}
          onPointerDown={(e) => {
            // Block all pointer interaction during playtest
            if (isPlaying && e.button === 0) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          onClick={(e) => {
            // Don't request pointer lock - right-click camera control works without it
            // Pointer lock can interfere with right-click context menu
          }}
        >
          <PlayerController />
          <SceneContent />
          <PlaytestR6Character isPlaying={isPlaying} />
        </Canvas>

        <GuiOverlay />
        <PlaytestAvatarUI isPlaying={isPlaying} />
        <PlaytestingSystem />
      </div>
    </div>
  );
}

// Playable R6 character
function PlayableCharacter() {
  const isPlaying = useStudio((s) => s.isPlaying);
  const rigRef = useRef(null);

  const { scene } = useThree();

  // Create R6 rig on playtest start
  useEffect(() => {
    if (!isPlaying || !scene) return;

    try {
      console.log("🎮 Creating playable character...");
      const rig = createR6Rig();
      rig.group.position.set(0, 5, 0);
      scene.add(rig.group);
      
      // Create appearance system with avatar presets
      const appearance = new CharacterAppearance(rig);
      appearance.setPreset("default"); // Start with default avatar
      
      rigRef.current = rig;
      
      // Expose to window for UI access
      window.__characterAppearance = appearance;
      console.log("✅ Playable character created with avatar system");
    } catch (err) {
      console.error("❌ Error creating playable character:", err, err.stack);
    }

    return () => {
      if (rigRef.current && scene) {
        try {
          scene.remove(rigRef.current.group);
        } catch (e) {}
        rigRef.current = null;
      }
      window.__characterAppearance = null;
    };
  }, [isPlaying, scene]);

  return null;
}

// Player movement controller (during play mode)
function PlayerController() {
  const isPlaying = useStudio((s) => s.isPlaying);
  const playerPosition = useStudio((s) => s.playerPosition);
  const playerVelocity = useStudio((s) => s.playerVelocity);
  const playerKeys = useStudio((s) => s.playerKeys);
  const playerAvatar = useStudio((s) => s.playerAvatar);
  const setPlayerKeys = useStudio((s) => s.setPlayerKeys);
  const setPlayerPosition = useStudio((s) => s.setPlayerPosition);
  const setPlayerVelocity = useStudio((s) => s.setPlayerVelocity);
  const setPlayerAvatar = useStudio((s) => s.setPlayerAvatar);

  const { camera, gl } = useThree();
  const cameraYawRef = useRef(0);
  const cameraPitchRef = useRef(-0.3);

  // Handle keyboard input
  useEffect(() => {
    if (!isPlaying) return;

    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      setPlayerKeys((prev) => {
        if (key === "w") return { ...prev, w: true };
        if (key === "a") return { ...prev, a: true };
        if (key === "s") return { ...prev, s: true };
        if (key === "d") return { ...prev, d: true };
        if (key === " ") return { ...prev, space: true };
        return prev;
      });
    };

    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();
      setPlayerKeys((prev) => {
        if (key === "w") return { ...prev, w: false };
        if (key === "a") return { ...prev, a: false };
        if (key === "s") return { ...prev, s: false };
        if (key === "d") return { ...prev, d: false };
        if (key === " ") return { ...prev, space: false };
        return prev;
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isPlaying, setPlayerKeys]);

  // Request pointer lock on play start (attempt)
  useEffect(() => {
    if (!isPlaying) {
      try {
        if (document.pointerLockElement) document.exitPointerLock?.();
      } catch (e) {}
      return;
    }
    // ensure there's a player avatar when entering play
    try {
      if (!playerAvatar) {
        if (window.AvatarSystem && typeof window.AvatarSystem.getAllAvatars === 'function') {
          const all = window.AvatarSystem.getAllAvatars();
          if (all && all.length) setPlayerAvatar(all[0]);
          else setPlayerAvatar({ skinColor: '#f1c27d', shirtColor: '#2563eb', pantsColor: '#0b1220' });
        } else {
          setPlayerAvatar({ skinColor: '#f1c27d', shirtColor: '#2563eb', pantsColor: '#0b1220' });
        }
      }
    } catch (e) {}

    // Don't request pointer lock - right-click camera control works better without it
  }, [isPlaying, gl]);

  // Handle mouse movement for camera rotation (pointer lock aware)
  useEffect(() => {
    if (!isPlaying) return;

    const sensitivity = 0.003;
    const handleMouseMove = (e) => {
      cameraYawRef.current -= e.movementX * sensitivity;
      cameraPitchRef.current -= e.movementY * sensitivity;
      cameraPitchRef.current = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cameraPitchRef.current));
    };

    const onPointerLockChange = () => {
      const locked = document.pointerLockElement !== null;
      if (locked) document.addEventListener("mousemove", handleMouseMove);
      else document.removeEventListener("mousemove", handleMouseMove);
    };

    document.addEventListener("pointerlockchange", onPointerLockChange);

    return () => {
      document.removeEventListener("pointerlockchange", onPointerLockChange);
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [isPlaying, camera]);

  // Physics and camera update loop (disabled during playtest when using R6 character)
  useFrame(() => {
    // PlayableCharacter handles all physics and camera during playtest
    if (isPlaying) return;
  });

  return null;
}

// Simple R6 avatar renderer used for play mode
function AvatarVisual({ config, position }) {
  if (!config) return null;
  const skin = config.skinColor || '#f1c27d';
  const shirt = config.shirtColor || '#2563eb';
  const pants = config.pantsColor || '#0b1220';

  return (
    <group position={position}>
      <mesh position={[0, 1.6, 0]}>
        <sphereGeometry args={[0.45, 24, 16]} />
        <meshStandardMaterial color={skin} />
      </mesh>
      <mesh position={[0, 0.85, 0]}>
        <boxGeometry args={[0.9, 1.0, 0.45]} />
        <meshStandardMaterial color={shirt} />
      </mesh>
      <mesh position={[-0.8, 1.05, 0]}>
        <boxGeometry args={[0.3, 0.9, 0.3]} />
        <meshStandardMaterial color={skin} />
      </mesh>
      <mesh position={[0.8, 1.05, 0]}>
        <boxGeometry args={[0.3, 0.9, 0.3]} />
        <meshStandardMaterial color={skin} />
      </mesh>
      <mesh position={[-0.25, 0.0, 0]}>
        <boxGeometry args={[0.4, 1.0, 0.4]} />
        <meshStandardMaterial color={pants} />
      </mesh>
      <mesh position={[0.25, 0.0, 0]}>
        <boxGeometry args={[0.4, 1.0, 0.4]} />
        <meshStandardMaterial color={pants} />
      </mesh>
      {config.faceUrl && (
        <sprite position={[0, 1.65, 0.46]}>
          <spriteMaterial attach="material" transparent map={new THREE.TextureLoader().load(config.faceUrl)} />
        </sprite>
      )}
      {config.accessoryUrl && (
        <mesh position={[0, 1.95, 0]}>
          <boxGeometry args={[0.6, 0.2, 0.4]} />
          <meshStandardMaterial map={new THREE.TextureLoader().load(config.accessoryUrl)} transparent />
        </mesh>
      )}
    </group>
  );
}

// Axis gizmo in corner
function AxisGizmo() {
  const { camera } = useThree();
  const groupRef = useRef();

  useFrame(() => {
    if (!groupRef.current) return;
    // Keep gizmo orientation aligned with camera
    groupRef.current.quaternion.copy(camera.quaternion);
  });

  return (
    <group ref={groupRef} position={[-3.5, -2.5, 0]}>
      {/* X axis - Red */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={2} itemSize={3} array={new Float32Array([0, 0, 0, 0.8, 0, 0])} />
        </bufferGeometry>
        <lineBasicMaterial color="#ff4444" linewidth={2} />
      </line>

      {/* Y axis - Green */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={2} itemSize={3} array={new Float32Array([0, 0, 0, 0, 0.8, 0])} />
        </bufferGeometry>
        <lineBasicMaterial color="#44ff44" linewidth={2} />
      </line>

      {/* Z axis - Blue */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={2} itemSize={3} array={new Float32Array([0, 0, 0, 0, 0, 0.8])} />
        </bufferGeometry>
        <lineBasicMaterial color="#4444ff" linewidth={2} />
      </line>

      {/* Axis labels */}
      <mesh position={[0.95, 0, 0]}>
        <boxGeometry args={[0.12, 0.12, 0.12]} />
        <meshBasicMaterial color="#ff4444" />
      </mesh>
      <mesh position={[0, 0.95, 0]}>
        <boxGeometry args={[0.12, 0.12, 0.12]} />
        <meshBasicMaterial color="#44ff44" />
      </mesh>
      <mesh position={[0, 0, 0.95]}>
        <boxGeometry args={[0.12, 0.12, 0.12]} />
        <meshBasicMaterial color="#4444ff" />
      </mesh>
    </group>
  );
}

// GUI preview overlay (StarterGui)
function GuiOverlay() {
  const objects = useStudio((s) => s.objects);

  const byId = useMemo(() => new Map(objects.map((o) => [o.id, o])), [objects]);
  const starterGui = "svc_startergui";

  const screenGuis = objects.filter((o) => o.className === "ScreenGui" && o.parentId === starterGui && o.enabled !== false);

  const allGui = useMemo(() => {
    const out = [];
    const walk = (id, depth) => {
      for (const o of objects) {
        if (o.parentId !== id) continue;
        if (o.visible === false) continue;
        if (["Frame", "TextLabel", "TextButton", "ImageLabel", "ImageButton"].includes(o.className)) out.push(o);
        walk(o.id, depth + 1);
      }
    };
    for (const sg of screenGuis) walk(sg.id, 0);
    return out;
  }, [objects, screenGuis]);

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {allGui.map((g) => {
        const pos = Array.isArray(g.guiPos) ? g.guiPos : [0, 0];
        const size = Array.isArray(g.guiSize) ? g.guiSize : [100, 50];

        const isText = g.className === "TextLabel" || g.className === "TextButton";
        const isImg = g.className === "ImageLabel" || g.className === "ImageButton";

        return (
          <div
            key={g.id}
            style={{
              position: "absolute",
              left: pos[0],
              top: pos[1],
              width: size[0],
              height: size[1],
              background: g.bg || "rgba(255,255,255,0.10)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 10,
              color: g.textColor || "#e5e7eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              overflow: "hidden",
            }}
          >
            {isImg && g.image ? <img src={g.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
            {isText ? <span style={{ padding: 8 }}>{g.text || ""}</span> : null}
          </div>
        );
      })}
    </div>
  );
}

function SceneContent() {
  const objects = useStudio((s) => s.objects);

  const selectedIds = useStudio((s) => s.selectedIds);
  const primaryId = useStudio((s) => s.primaryId);
  const selectOnly = useStudio((s) => s.selectOnly);
  const toggleSelect = useStudio((s) => s.toggleSelect);

  const applyTransforms = useStudio((s) => s.applyTransforms);
  const applyTransformsPreview = useStudio((s) => s.applyTransformsPreview);
  const transformMode = useStudio((s) => s.transformMode);
  const transformSpace = useStudio((s) => s.transformSpace);

  const snapEnabled = useStudio((s) => s.snapEnabled);
  const moveSnap = useStudio((s) => s.moveSnap);
  const rotateSnapDeg = useStudio((s) => s.rotateSnapDeg);
  const scaleSnap = useStudio((s) => s.scaleSnap);

  const isPlaying = useStudio((s) => s.isPlaying);
  const runtimeRootId = useStudio((s) => s.runtimeRootId);
  const equippedToolId = useStudio((s) => s.equippedToolId);
  const applyTerrainBrush = useStudio((s) => s.applyTerrainBrush);

  // Terrain UI state
  const terrainMode = useUI((u) => u.terrainMode);
  const terrainBrushType = useUI((u) => u.terrainBrushType);
  const terrainBrushRadius = useUI((u) => u.terrainBrushRadius);
  const terrainBrushStrength = useUI((u) => u.terrainBrushStrength);
  const terrainFlattenHeight = useUI((u) => u.terrainFlattenHeight);
  const setTerrainBrushRadius = useUI((u) => u.setTerrainBrushRadius);

  // Grid visibility
  const gridVisible = useUI((u) => u.gridVisible);

  const [hoveredId, setHoveredId] = useState(null);
  const [isTerrainPaintingRef] = useState(() => new Map());
  const [isDraggingGizmo, setIsDraggingGizmo] = useState(false);

  const byId = useMemo(() => new Map(objects.map((o) => [o.id, o])), [objects]);

  // Lighting sky -> background color
  const sky = useMemo(() => objects.find((o) => o.className === "Sky" && o.parentId === "svc_lighting") || null, [objects]);
  const bg = sky?.bottomColor || "#060913";

  const worldTRSById = useMemo(() => {
    const memo = new Map();
    const out = new Map();
    for (const o of objects) {
      const w = getWorldMatrix(o.id, byId, memo);
      out.set(o.id, decomposeMatrix(w));
    }
    return out;
  }, [objects, byId]);

  const workspaceId = "svc_workspace";
  const isInWorkspace = (o) => {
    let cur = o;
    while (cur?.parentId) {
      if (cur.parentId === workspaceId) return true;
      cur = byId.get(cur.parentId);
    }
    return o.parentId === workspaceId;
  };

  const viewportParts = objects.filter((o) => (o.className === "Part" || o.className === "SpawnLocation") && (o.parentId === workspaceId || isInWorkspace(o)));
  const viewportTerrains = objects.filter((o) => o.className === "Terrain" && (o.parentId === workspaceId || isInWorkspace(o)));
  const viewportTerrainGenerators = objects.filter((o) => o.className === "TerrainGenerator" && (o.parentId === workspaceId || isInWorkspace(o)));

  const primaryObj = primaryId ? byId.get(primaryId) : null;

  const transformRef = useRef();
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef(null);
  const suppressPickUntil = useRef(0);
  const [dummy] = useState(() => new THREE.Object3D());
  const canvasRef = useRef(null);

  const canPick = () => !isDraggingGizmo && performance.now() > suppressPickUntil.current;

  const snapN = (v, step) => (step > 0 ? Math.round(v / step) * step : v);
  const deg2rad = (d) => (d * Math.PI) / 180;

  // keep dummy synced to primary
  useEffect(() => {
    if (!primaryObj || primaryObj.className !== "Part" || !hasTRS(primaryObj)) return;
    if (isDraggingRef.current) return;

    const wt = worldTRSById.get(primaryObj.id);
    if (!wt) return;

    dummy.position.set(...wt.position);
    dummy.rotation.set(...wt.rotation);
    dummy.scale.set(...wt.scale);
    dummy.updateMatrix();
  }, [primaryObj, worldTRSById, dummy]);

  const applyFromDummy = (commit = false) => {
    if (!dragStartRef.current) return;

    if (snapEnabled) {
      if (transformMode === "translate") {
        dummy.position.set(snapN(dummy.position.x, moveSnap), snapN(dummy.position.y, moveSnap), snapN(dummy.position.z, moveSnap));
      } else if (transformMode === "rotate") {
        const step = deg2rad(rotateSnapDeg);
        dummy.rotation.set(snapN(dummy.rotation.x, step), snapN(dummy.rotation.y, step), snapN(dummy.rotation.z, step));
      } else if (transformMode === "scale") {
        dummy.scale.set(
          Math.max(0.01, snapN(dummy.scale.x, scaleSnap)),
          Math.max(0.01, snapN(dummy.scale.y, scaleSnap)),
          Math.max(0.01, snapN(dummy.scale.z, scaleSnap))
        );
      }
    }

    dummy.updateMatrix();

    const { startDummyWorld, startWorldById, startParentWorldById } = dragStartRef.current;
    const invStart = startDummyWorld.clone().invert();
    const delta = new THREE.Matrix4().multiplyMatrices(dummy.matrix, invStart);

    const updates = [];
    for (const [id, startWorld] of startWorldById.entries()) {
      const parentWorld = startParentWorldById.get(id) || new THREE.Matrix4();
      const invParent = parentWorld.clone().invert();

      const newWorld = new THREE.Matrix4().multiplyMatrices(delta, startWorld);
      const newLocal = new THREE.Matrix4().multiplyMatrices(invParent, newWorld);
      const trs = decomposeMatrix(newLocal);

      updates.push({ id, position: trs.position, rotation: trs.rotation, scale: trs.scale });
    }

    if (commit) {
      applyTransforms(updates);
    } else {
      applyTransformsPreview(updates);
    }
  };

  // Terrain painting with mouse
  useEffect(() => {
    if (!terrainMode || viewportTerrains.length === 0) return;

    const terrainId = viewportTerrains[0].id; // Paint first terrain
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const camera = useStudio.getState().camera || null;

    const handleMouseMove = (e) => {
      if (!e.buttons) {
        isTerrainPaintingRef.clear();
        return;
      }

      if (!(e.buttons & 1) && !(e.buttons & 4)) return; // Left or right button
      const invert = e.shiftKey;

      const canvas = canvasRef.current?.querySelector("canvas");
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // Would need camera context from useThree - we'll add this in a frame update instead
    };

    const handleWheel = (e) => {
      if (!terrainMode) return;
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();

      const delta = e.deltaY > 0 ? -1 : 1;
      setTerrainBrushRadius(terrainBrushRadius + delta);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("wheel", handleWheel);
    };
  }, [terrainMode, viewportTerrains, terrainBrushRadius, terrainBrushType, terrainBrushStrength, terrainFlattenHeight]);

  useEffect(() => {
    const tc = transformRef.current;
    if (!tc) return;

    const onDraggingChanged = (e) => {
      if (e.value) {
        isDraggingRef.current = true;
        setIsDraggingGizmo(true);

        dummy.updateMatrix();
        const startDummyWorld = dummy.matrix.clone();

        const memo = new Map();
        const roots = selectionRoots(selectedIds, byId);

        const startWorldById = new Map();
        const startParentWorldById = new Map();

        for (const id of roots) {
          const node = byId.get(id);
          if (!node || (node.className !== "Part" && node.className !== "TerrainGenerator" && node.className !== "SpawnLocation") || !hasTRS(node)) continue;

          const w = getWorldMatrix(id, byId, memo);
          startWorldById.set(id, w);

          if (node.parentId) startParentWorldById.set(id, getWorldMatrix(node.parentId, byId, memo));
          else startParentWorldById.set(id, new THREE.Matrix4());
        }

        dragStartRef.current = { startDummyWorld, startWorldById, startParentWorldById };
      } else {
        applyFromDummy(true);
        dragStartRef.current = null;
        isDraggingRef.current = false;
        suppressPickUntil.current = performance.now() + 120;
        // Reset gizmo drag flag to prevent pointer events from selecting on this frame
        setIsDraggingGizmo(false);
      }
    };

    const onObjectChange = () => {
      if (!isDraggingRef.current) return;
      applyFromDummy(false);
    };

    tc.addEventListener("dragging-changed", onDraggingChanged);
    tc.addEventListener("objectChange", onObjectChange);
    return () => {
      tc.removeEventListener("dragging-changed", onDraggingChanged);
      tc.removeEventListener("objectChange", onObjectChange);
    };
  }, [byId, selectedIds, transformMode, transformSpace, snapEnabled, moveSnap, rotateSnapDeg, scaleSnap]);

  // Frame update for terrain painting
  useFrame(({ camera, raycaster, mouse: threeMouseRef }) => {
    if (!terrainMode || viewportTerrains.length === 0) return;

    const { buttons, shiftKey } = window.__mouseState || { buttons: 0, shiftKey: false };
    if (!(buttons & 1)) return; // Only left button

    const terrainId = viewportTerrains[0].id;
    const terrainObj = byId.get(terrainId);
    if (!terrainObj) return;

    // Get mouse position from the event
    const canvas = document.querySelector("canvas");
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = ((window.__lastMouseEvent?.clientX || 0) - rect.left) / rect.width * 2 - 1;
    const mouseY = -((window.__lastMouseEvent?.clientY || 0) - rect.top) / rect.height * 2 + 1;

    raycaster.setFromCamera({ x: mouseX, y: mouseY }, camera);

    // Simple plane raycast (terrain is on XZ plane at various Y heights)
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersection);

    if (intersection) {
      const radius = terrainBrushRadius;
      const strength = shiftKey ? -terrainBrushStrength : terrainBrushStrength;
      const mode = shiftKey && terrainBrushType === "raise" ? "lower" : shiftKey && terrainBrushType === "lower" ? "raise" : terrainBrushType;

      applyTerrainBrush({
        terrainId,
        worldPos: [intersection.x, intersection.y, intersection.z],
        radius,
        strength,
        mode,
        targetHeight: terrainFlattenHeight,
      });
    }
  });

  // Track mouse state for terrain painting
  useEffect(() => {
    const handleMouseDown = (e) => {
      window.__mouseState = { buttons: e.buttons, shiftKey: e.shiftKey };
      window.__lastMouseEvent = e;
    };

    const handleMouseMove = (e) => {
      window.__mouseState = { buttons: e.buttons, shiftKey: e.shiftKey };
      window.__lastMouseEvent = e;
    };

    const handleMouseUp = (e) => {
      window.__mouseState = { buttons: e.buttons, shiftKey: e.shiftKey };
      window.__lastMouseEvent = e;
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // Note: Custom skybox images are loaded from public/sky/ (4-face cubemap: right, left, top, bottom)
  const skyboxFiles = [
    "/sky/right.png",
    "/sky/left.png",
    "/sky/px.png",     // top/up face (using px as fallback if needed)
    "/sky/nx.png",     // bottom/down face (using nx as fallback if needed)
    "/sky/front.png",
    "/sky/back.png",
  ];

  return (
    <>
      {/* Playable R6 Character during playtest - handled by PlaytestR6Character component */}

      {/* Custom 4-face cubemap skybox */}
      <Environment background files={skyboxFiles} />

      {/* Fallback background color */}
      <color attach="background" args={[bg]} />

      <ambientLight intensity={0.6} />
      <directionalLight position={[6, 10, 6]} intensity={1.2} castShadow />

      {gridVisible && <Grid args={[512, 512]} sectionSize={32} sectionThickness={1} cellSize={2} cellThickness={0.6} fadeDistance={300} fadeStrength={1} />}

      {gridVisible && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[2048, 2048]} />
          <meshStandardMaterial color={"#0a122a"} />
        </mesh>
      )}

      {/* Grid helper */}
      {gridVisible && <gridHelper args={[100, 20, "#666666", "#333333"]} position={[0, 0.01, 0]} />}

      <primitive object={dummy} />

      {/* Terrain meshes */}
      {viewportTerrains.map((terrain) => (
        <TerrainMesh
          key={terrain.id}
          terrain={terrain}
          isSelected={selectedIds.includes(terrain.id)}
          isPrimary={primaryId === terrain.id}
          isDraggingGizmo={isDraggingGizmo}
          onPick={(e) => {
            if (isPlaying) return; // Don't edit during playtest
            const multi = e.ctrlKey || e.metaKey;
            if (multi) toggleSelect(terrain.id);
            else selectOnly(terrain.id);
          }}
        />
      ))}

      {viewportTerrainGenerators.map((o) => (
        <TerrainGeneratorMesh
          key={o.id}
          obj={o}
          worldTRS={worldTRSById.get(o.id)}
          isSelected={selectedIds.includes(o.id)}
          isPrimary={primaryId === o.id}
          isHovered={hoveredId === o.id}
          isDraggingGizmo={isDraggingGizmo}
          onPick={(e) => {
            if (isPlaying) return; // Don't edit during playtest
            if (e.isHover !== undefined) {
              setHoveredId(e.isHover ? o.id : null);
              return;
            }
            const multi = e.ctrlKey || e.metaKey;
            if (multi) toggleSelect(o.id);
            else selectOnly(o.id);
          }}
        />
      ))}

      {viewportParts.map((o) => (
        <PartMesh
          key={o.id}
          obj={o}
          worldTRS={worldTRSById.get(o.id)}
          isSelected={selectedIds.includes(o.id)}
          isPrimary={primaryId === o.id}
          isHovered={hoveredId === o.id}
          isDraggingGizmo={isDraggingGizmo}
          onPick={(e) => {
            if (isPlaying) return; // Don't edit during playtest
            if (e.isHover !== undefined) {
              setHoveredId(e.isHover ? o.id : null);
              return;
            }
            const multi = e.ctrlKey || e.metaKey;
            if (multi) toggleSelect(o.id);
            else selectOnly(o.id);
          }}
        />
      ))}

      {!isPlaying && <TransformControls ref={transformRef} object={dummy} mode={transformMode} space={transformSpace} enabled={primaryObj?.className === "Part" || primaryObj?.className === "TerrainGenerator" || primaryObj?.className === "SpawnLocation"} />}

      {!isPlaying && <StudioCameraControls enabled={!isDraggingGizmo} />}

      {/* Axis gizmo */}
      {!isPlaying && <AxisGizmo />}

      {/* Tool visual (MVP): show a small handle near player if equipped */}
      {isPlaying && runtimeRootId && equippedToolId && (
        <mesh position={[1.6, 3.0, 0]}>
          <boxGeometry args={[0.2, 1.0, 0.2]} />
          <meshStandardMaterial color={"#f97316"} />
        </mesh>
      )}
    </>
  );
}
