import React, { useState } from "react";
import { useStudio } from "../store";

/**
 * Material Setter with Texture Support
 * Allows users to apply textures to selected parts
 */
export default function MaterialSetter() {
  const [tab, setTab] = useState("materials");
  const selectedIds = useStudio((s) => s.selectedIds);
  const setProp = useStudio((s) => s.setProp);

  const materials = [
    {
      name: "Wood",
      id: "wood",
      color: "#8b6914",
      roughness: 0.8,
      metallic: 0,
      texture: "wood_grain.jpg",
    },
    {
      name: "Metal",
      id: "metal",
      color: "#a8a8a8",
      roughness: 0.3,
      metallic: 1,
      texture: "metal_brushed.jpg",
    },
    {
      name: "Plastic",
      id: "plastic",
      color: "#2d2d2d",
      roughness: 0.5,
      metallic: 0,
      texture: "plastic_smooth.jpg",
    },
    {
      name: "Glass",
      id: "glass",
      color: "#e8f4f8",
      roughness: 0.1,
      metallic: 0,
      texture: "glass_clear.jpg",
    },
    {
      name: "Brick",
      id: "brick",
      color: "#c84b31",
      roughness: 0.9,
      metallic: 0,
      texture: "brick_wall.jpg",
    },
    {
      name: "Marble",
      id: "marble",
      color: "#e5e5e5",
      roughness: 0.3,
      metallic: 0,
      texture: "marble_white.jpg",
    },
  ];

  const handleMaterialSelect = (material) => {
    if (!selectedIds.length) {
      alert("Select parts first!");
      return;
    }

    for (const id of selectedIds) {
      setProp(id, {
        material: material.id,
        texture: `textures/${material.texture}`,
        materialProps: {
          color: material.color,
          roughness: material.roughness,
          metallic: material.metallic,
        },
      });
    }
  };

  if (!selectedIds.length) {
    return (
      <div
        style={{
          padding: "20px",
          background: "#1f2937",
          borderRadius: "8px",
          color: "#999",
          textAlign: "center",
          fontSize: "12px",
        }}
      >
        Select parts to apply materials
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={() => setTab("materials")}
          style={{
            padding: "6px 12px",
            background: tab === "materials" ? "#0e639c" : "#374151",
            color: "#fff",
            border: "1px solid #4b5563",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "11px",
          }}
        >
          📦 Materials
        </button>
        <button
          onClick={() => setTab("custom")}
          style={{
            padding: "6px 12px",
            background: tab === "custom" ? "#0e639c" : "#374151",
            color: "#fff",
            border: "1px solid #4b5563",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "11px",
          }}
        >
          🎨 Custom
        </button>
      </div>

      {/* Materials Grid */}
      {tab === "materials" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
          {materials.map((mat) => (
            <div
              key={mat.id}
              onClick={() => handleMaterialSelect(mat)}
              style={{
                padding: "12px",
                background: "#2d3748",
                border: "1px solid #4b5563",
                borderRadius: "6px",
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#374151";
                e.currentTarget.style.borderColor = "#60a5fa";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#2d3748";
                e.currentTarget.style.borderColor = "#4b5563";
              }}
            >
              <div
                style={{
                  width: "30px",
                  height: "30px",
                  background: mat.color,
                  borderRadius: "4px",
                  border: "1px solid rgba(0,0,0,0.3)",
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "11px", fontWeight: "bold", color: "#cbd5e1" }}>
                  {mat.name}
                </div>
                <div style={{ fontSize: "9px", color: "#999", marginTop: "2px" }}>
                  Roughness: {(mat.roughness * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Custom Texture Input */}
      {tab === "custom" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <input
            type="text"
            placeholder="Enter texture URL..."
            onChange={(e) => {
              if (e.target.value && selectedIds.length) {
                for (const id of selectedIds) {
                  setProp(id, { texture: e.target.value });
                }
              }
            }}
            style={{
              padding: "8px 10px",
              background: "#1f2937",
              border: "1px solid #4b5563",
              borderRadius: "4px",
              color: "#fff",
              fontSize: "12px",
              outline: "none",
            }}
          />
          <div style={{ fontSize: "10px", color: "#999" }}>
            💡 Use URLs like: textures/wood.jpg or https://example.com/texture.png
          </div>
        </div>
      )}
    </div>
  );
}
