import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { generateTerrain, smoothTerrainEdges } from "../utils/terrainGenerator.js";

/**
 * TerrainGeneratorMesh - Renders procedurally generated terrain
 * Regenerates when bounds change (through scaling)
 */
export function TerrainGeneratorMesh({
  obj,
  worldTRS,
  isSelected,
  isPrimary,
  onPick,
  isHovered,
  isDraggingGizmo,
}) {
  if (!worldTRS) return null;

  const { position, rotation, scale } = worldTRS;
  const [terrain, setTerrain] = useState(null);
  const meshRef = useRef();
  const pointerDownRef = useRef({ x: 0, y: 0 });
  const lastScaleRef = useRef([...scale]);

  // Generate terrain based on object bounds (scale)
  useEffect(() => {
    const bounds = {
      x: (obj.scale?.[0] ?? 1) * 2, // Default cube is 1 unit, multiply by 2 for box dimensions
      y: (obj.scale?.[1] ?? 1) * 2,
      z: (obj.scale?.[2] ?? 1) * 2,
    };

    // Generate new terrain based on bounds
    const newTerrain = generateTerrain(bounds, {
      cellSize: 1,
      scale: 25,
      frequency: 0.05,
      maxHeight: bounds.y * 0.8,
      seed: obj.id.charCodeAt(0) + obj.id.charCodeAt(1), // Use object ID for consistent seed
    });

    setTerrain(newTerrain);
    lastScaleRef.current = [...scale];
  }, [obj.scale, obj.id]);

  // Handle pointer interaction
  const handlePointerDown = (e) => {
    e.stopPropagation();
    pointerDownRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e) => {
    e.stopPropagation();
    if (!isDraggingGizmo) {
      const dx = Math.abs(e.clientX - pointerDownRef.current.x);
      const dy = Math.abs(e.clientY - pointerDownRef.current.y);
      if (dx < 3 && dy < 3) {
        onPick?.(e);
      }
    }
  };

  // Generate geometry from heightmap
  const geometry = useMemo(() => {
    if (!terrain || !Array.isArray(terrain.heights)) return null;

    const { width, depth, cellSize, heights, colors } = terrain;
    const geo = new THREE.BufferGeometry();

    // Create vertices from heightmap
    const positions = [];
    const colorArray = [];

    for (let z = 0; z < depth; z++) {
      for (let x = 0; x < width; x++) {
        const idx = z * width + x;
        const heightVal = heights[idx] || 0;
        positions.push(x * cellSize - (width * cellSize) / 2, heightVal, z * cellSize - (depth * cellSize) / 2);

        // Convert color hex to RGB
        const col = colors[idx] || 0xffffff;
        const r = ((col >> 16) & 255) / 255;
        const g = ((col >> 8) & 255) / 255;
        const b = (col & 255) / 255;
        colorArray.push(r, g, b);
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
    geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(colorArray), 3));
    geo.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
    geo.computeVertexNormals();
    geo.computeBoundingBox();

    return geo;
  }, [terrain]);

  if (!geometry) return null;

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh
        ref={meshRef}
        geometry={geometry}
        castShadow
        receiveShadow
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerEnter={() => onPick?.({ isHover: true, id: obj.id })}
        onPointerLeave={() => onPick?.({ isHover: false, id: obj.id })}
      >
        {/* Material with vertex colors */}
        <meshStandardMaterial
          vertexColors={true}
          roughness={0.8}
          metalness={0.1}
          emissive={isPrimary ? "#60a5fa" : isSelected ? "#3b82f6" : isHovered ? "#1e40af" : "#000000"}
          emissiveIntensity={isPrimary ? 0.4 : isSelected ? 0.2 : isHovered ? 0.15 : 0}
        />
      </mesh>

      {/* Outline for selected */}
      {isSelected && (
        <mesh>
          <boxGeometry args={[terrain.bounds.x * 1.02, terrain.bounds.y * 1.02, terrain.bounds.z * 1.02]} />
          <meshBasicMaterial color="#3b82f6" wireframe polygonOffset polygonOffsetUnits={-1} />
        </mesh>
      )}

      {/* Thicker outline for primary */}
      {isPrimary && (
        <mesh>
          <boxGeometry args={[terrain.bounds.x * 1.04, terrain.bounds.y * 1.04, terrain.bounds.z * 1.04]} />
          <meshBasicMaterial color="#60a5fa" wireframe polygonOffset polygonOffsetUnits={-2} />
        </mesh>
      )}
    </group>
  );
}

export default TerrainGeneratorMesh;
