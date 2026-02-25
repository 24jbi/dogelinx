import React, { useEffect, useRef, useState } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { loadGLBModel, HumanoidController, CharacterAppearance } from "../R6Rig.js";
import { AvatarShop } from "./AvatarShop.jsx";
import DTShop from "./DTShop.jsx";
import ItemUploadManager from "./ItemUploadManager.jsx";

function AvatarPreviewCanvas({ appearance, selectedItems }) {
  const { scene } = useThree();
  const rigRef = useRef(null);
  const raycaster = useRef(new THREE.Raycaster());

  useEffect(() => {
    const loadCharacter = async () => {
      try {
        // Clean up old model first
        if (rigRef.current?.rig) {
          scene.remove(rigRef.current.rig.group);
          rigRef.current = null;
        }

        // Load GLB model
        const rig = await loadGLBModel("/avatar items/dogelinx_r6_rigged.glb");
        rig.group.position.set(0, -1.2, 0);
        rig.group.scale.set(0.5, 0.5, 0.5);
        scene.add(rig.group);

        // Create appearance
        const char = new CharacterAppearance(rig);
        if (appearance?.preset) {
          char.setPreset(appearance.preset);
        } else if (appearance?.colors) {
          char.setColors(appearance.colors);
        }

        // Equip selected items
        if (selectedItems && Array.isArray(selectedItems)) {
          selectedItems.forEach((item, idx) => {
            char.equipItem(`item_${idx}`, item);
          });
        }

        rigRef.current = { rig, char };
      } catch (err) {
        console.error("Failed to load character preview:", err);
      }
    };

    loadCharacter();

    return () => {
      if (rigRef.current?.rig) {
        scene.remove(rigRef.current.rig.group);
        rigRef.current = null;
      }
    };
  }, [scene, appearance, selectedItems]);

  useFrame(() => {
    // Rotate character slowly
    if (rigRef.current?.rig) {
      rigRef.current.rig.group.rotation.y += 0.01;
    }
  });

  return null;
}

export default function AvatarCustomizer() {
  const [userTokens, setUserTokens] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [ownedItems, setOwnedItems] = useState([]);
  const [equippedItems, setEquippedItems] = useState(() => {
    // Load from localStorage on init
    try {
      return JSON.parse(localStorage.getItem("dogelinx_equipped_items") || "[]");
    } catch {
      return [];
    }
  });
  const [currentAppearance, setCurrentAppearance] = useState({
    preset: "default",
    colors: { skin: "#ffa55f", shirt: "#0055ff", pants: "#000000" }
  });

  // Load user on mount
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("dogelinx_currentUser") || "null");
    if (user) {
      setCurrentUser(user);
      setUserTokens(user.dogeTokens || 0);
      // Load user's owned items from their account
      if (Array.isArray(user.itemsOwned)) {
        setOwnedItems(user.itemsOwned);
      }
    }
  }, []);

  const handlePurchaseItem = async (items) => {
    const total = items.reduce((sum, item) => sum + item.price, 0);
    
    if (userTokens < total) {
      alert(`Not enough DT! Need ${total}, have ${userTokens}`);
      return;
    }

    // Deduct tokens
    const newBalance = userTokens - total;
    setUserTokens(newBalance);
    
    // Update user in storage
    if (currentUser) {
      const updated = { ...currentUser, dogeTokens: newBalance };
      localStorage.setItem("dogelinx_currentUser", JSON.stringify(updated));
    }
    
    const newOwnedItems = items.map(item => item.id);
    setOwnedItems(prev => [...prev, ...newOwnedItems]);
  };

  const handleEquipItem = (item) => {
    const isEquipped = equippedItems.some(e => e.id === item.id);
    
    let newEquipped;
    if (isEquipped) {
      // Remove from equipped
      newEquipped = equippedItems.filter(e => e.id !== item.id);
    } else {
      // Add to equipped (limit one per type)
      newEquipped = equippedItems.filter(e => e.type !== item.type);
      newEquipped = [...newEquipped, item];
    }

    setEquippedItems(newEquipped);
    // Save to localStorage so it persists across pages
    localStorage.setItem("dogelinx_equipped_items", JSON.stringify(newEquipped));
  };

  const handlePresetChange = (preset) => {
    setCurrentAppearance({
      preset,
      colors: {
        default: { skin: "#ffa55f", shirt: "#0055ff", pants: "#000000" },
        forest: { skin: "#c99d66", shirt: "#2d5016", pants: "#1a3a0a" },
        ocean: { skin: "#f0ad4e", shirt: "#1e90ff", pants: "#00008b" },
        sunset: { skin: "#ffe4b5", shirt: "#ff6347", pants: "#8b4513" },
        cyber: { skin: "#e0e0e0", shirt: "#00ffff", pants: "#ff00ff" },
        nature: { skin: "#daa520", shirt: "#228b22", pants: "#8b7355" },
        royal: { skin: "#fdbcb4", shirt: "#4169e1", pants: "#ffd700" },
      }[preset]
    });
  };

  const presets = ["default", "forest", "ocean", "sunset", "cyber", "nature", "royal"];
  const ownedItemsData = ownedItems.map(id => {
    // Find item from shop
    const allItems = [
      { id: "hat_crown", name: "Crown", type: "hat", color: "#ffd700" },
      { id: "hat_tophat", name: "Top Hat", type: "hat", color: "#000000" },
      { id: "hat_beanie", name: "Beanie", type: "hat", color: "#ff0000" },
      { id: "shirt_classic", name: "Classic Blue", type: "shirt", color: "#0055ff" },
      { id: "shirt_red", name: "Red Tee", type: "shirt", color: "#ff0000" },
      { id: "shirt_green", name: "Green Shirt", type: "shirt", color: "#00aa00" },
      { id: "shirt_black", name: "Black Shirt", type: "shirt", color: "#1a1a1a" },
      { id: "shirt_gold", name: "Gold Shirt", type: "shirt", color: "#ffaa00" },
      { id: "pants_black", name: "Black Pants", type: "pants", color: "#000000" },
      { id: "pants_blue", name: "Blue Jeans", type: "pants", color: "#0055ff" },
      { id: "pants_khaki", name: "Khaki Pants", type: "pants", color: "#c9b37a" },
      { id: "pants_red", name: "Red Pants", type: "pants", color: "#ff0000" },
    ];
    return allItems.find(item => item.id === id);
  }).filter(Boolean);

  return (
    <div style={{
      display: "flex",
      height: "100%",
      background: "#0f1219",
      color: "#fff",
      overflow: "hidden"
    }}>
      {/* Left panel: Avatar preview */}
      <div style={{
        flex: "0 0 40%",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid #2d3748",
        overflow: "auto"
      }}>
        <div style={{ padding: "16px", borderBottom: "1px solid #2d3748" }}>
          <h2 style={{ margin: "0 0 12px 0", fontSize: "16px" }}>👤 Your Avatar</h2>
          <div style={{ fontSize: "12px", color: "#aaa" }}>
            💰 Balance: <span style={{ color: "#00ff00" }}>{userTokens} DT</span>
          </div>
        </div>

        {/* 3D Canvas */}
        <div style={{ flex: 1, background: "#1a1a1a", position: "relative" }}>
          <Canvas
            camera={{ position: [0, 0.5, 8], fov: 40 }}
            style={{ width: "100%", height: "100%" }}
          >
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 5, 5]} intensity={0.8} />
            <AvatarPreviewCanvas appearance={currentAppearance} selectedItems={equippedItems} />
          </Canvas>
        </div>

        {/* Presets */}
        <div style={{ padding: "16px", borderTop: "1px solid #2d3748" }}>
          <div style={{ fontSize: "11px", fontWeight: "bold", color: "#aaa", marginBottom: "8px", textTransform: "uppercase" }}>
            🎨 Presets
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {presets.map(preset => (
              <button
                key={preset}
                onClick={() => handlePresetChange(preset)}
                style={{
                  padding: "6px 12px",
                  background: currentAppearance.preset === preset ? "#0e639c" : "#333",
                  border: "1px solid #555",
                  color: "#fff",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "10px",
                  textTransform: "capitalize"
                }}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Equipped Items */}
        <div style={{ padding: "16px", borderTop: "1px solid #2d3748" }}>
          <div style={{ fontSize: "11px", fontWeight: "bold", color: "#aaa", marginBottom: "8px", textTransform: "uppercase" }}>
            ✨ Equipped ({equippedItems.length})
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {equippedItems.length === 0 ? (
              <div style={{ fontSize: "11px", color: "#666" }}>No items equipped</div>
            ) : (
              equippedItems.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "6px 10px",
                    background: "#2d3748",
                    border: "1px solid #0e639c",
                    borderRadius: "4px",
                    fontSize: "10px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <span style={{
                    width: "16px",
                    height: "16px",
                    background: item.color,
                    borderRadius: "2px"
                  }} />
                  {item.name}
                  <button
                    onClick={() => handleEquipItem(item)}
                    style={{
                      marginLeft: "4px",
                      padding: "0 4px",
                      background: "none",
                      border: "none",
                      color: "#ff6b6b",
                      cursor: "pointer",
                      fontSize: "10px"
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right panel: Inventory + Shop */}
      <div style={{
        flex: "1",
        display: "flex",
        flexDirection: "column",
        overflow: "auto"
      }}>
        {/* Inventory */}
        <div style={{ padding: "16px", borderBottom: "1px solid #2d3748" }}>
          <h3 style={{ margin: "0 0 12px 0", fontSize: "14px" }}>📦 Inventory ({ownedItemsData.length})</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "12px" }}>
            {ownedItemsData.map((item, idx) => (
              <div
                key={idx}
                onClick={() => handleEquipItem(item)}
                style={{
                  background: "#2d3748",
                  border: equippedItems.some(e => e.id === item.id) ? "2px solid #0e639c" : "1px solid #555",
                  borderRadius: "6px",
                  padding: "12px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  textAlign: "center"
                }}
              >
                <div style={{
                  width: "100%",
                  height: "50px",
                  background: item.color,
                  borderRadius: "4px",
                  marginBottom: "8px"
                }} />
                <div style={{ fontSize: "10px", fontWeight: "bold" }}>
                  {item.name}
                </div>
                <div style={{ fontSize: "9px", color: "#aaa", marginTop: "4px" }}>
                  {item.type}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shop */}
        <div style={{ flex: 1, overflow: "auto", padding: "16px" }}>
          <h3 style={{ margin: "0 0 12px 0", fontSize: "14px" }}>🛍️ Avatar Shop</h3>
          <AvatarShop
            userTokens={userTokens}
            ownedItems={ownedItems}
            onInventoryUpdate={(updated) => {
              setCurrentUser(updated);
              setUserTokens(updated.dogeTokens || 0);
              setOwnedItems(updated.itemsOwned || []);
              localStorage.setItem("dogelinx_currentUser", JSON.stringify(updated));
            }}
          />
          
          <div style={{ marginTop: "20px" }}>
            <DTShop 
              userTokens={userTokens}
              onPurchase={(amount) => {
                setUserTokens(prev => prev + amount);
                if (currentUser) {
                  const updated = { ...currentUser, dogeTokens: userTokens + amount };
                  localStorage.setItem("dogelinx_currentUser", JSON.stringify(updated));
                }
              }}
              username={currentUser?.username}
            />
          </div>

          <div style={{ marginTop: "20px", borderTop: "1px solid #2d3748", paddingTop: "20px" }}>
            <ItemUploadManager />
          </div>
        </div>
      </div>
    </div>
  );
}
