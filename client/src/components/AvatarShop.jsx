import React, { useState, useEffect } from "react";
import { CharacterAppearance } from "../R6Rig.js";
import { API_BASE_URL } from "../utils/apiClient";

export function AvatarShop({ userTokens: initialTokens = 0, onPurchaseItem, ownedItems: initialOwned = [], onInventoryUpdate }) {
  const [selectedCategory, setSelectedCategory] = useState("hats");
  const [items, setItems] = useState([]);
  const [userTokens, setUserTokens] = useState(initialTokens);
  const [ownedItems, setOwnedItems] = useState(initialOwned || []);
  const [notification, setNotification] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [purchasing, setPurchasing] = useState(false);
  
  // Load items from server and current user
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("dogelinx_currentUser") || "null");
    setCurrentUser(user);
    
    if (user?.dogeTokens) {
      setUserTokens(user.dogeTokens);
    }
    if (user?.itemsOwned) {
      setOwnedItems(user.itemsOwned || []);
    }
    
    loadItems();
  }, []);

  useEffect(() => {
    setUserTokens(initialTokens);
  }, [initialTokens]);

  const loadItems = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/items`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (err) {
      console.error("Error loading items:", err);
    }
  };

  const filteredItems = items.filter((item) => item.category === selectedCategory);
  const isOwned = (itemId) => ownedItems.includes(itemId);

  const handlePurchase = async (item) => {
    if (!currentUser) {
      setNotification("❌ You must be logged in to purchase items");
      setTimeout(() => setNotification(""), 3000);
      return;
    }

    if (userTokens < item.price) {
      setNotification("❌ Not enough DT tokens!");
      setTimeout(() => setNotification(""), 3000);
      return;
    }

    if (isOwned(item.id)) {
      setNotification("✓ You already own this item");
      setTimeout(() => setNotification(""), 3000);
      return;
    }

    try {
      setPurchasing(true);
      const res = await fetch(`${API_BASE_URL}/api/items/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: item.id,
          username: currentUser.username,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Purchase failed");
      }

      const data = await res.json();
      
      // Update local state
      setUserTokens(data.buyer.dogeTokens);
      setOwnedItems([...ownedItems, item.id]);
      
      // Update localStorage
      const updated = { ...currentUser, ...data.buyer };
      localStorage.setItem("dogelinx_currentUser", JSON.stringify(updated));
      
      // Notify parent
      if (onInventoryUpdate) {
        onInventoryUpdate(updated);
      }

      setNotification(`✅ Purchased "${item.name}"! (creator earned ${Math.floor(item.price * 0.9)} DT)`);
      setTimeout(() => setNotification(""), 3000);
    } catch (err) {
      setNotification(`❌ ${err.message}`);
      setTimeout(() => setNotification(""), 3000);
      console.error("Purchase error:", err);
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div style={{
      display: "flex",
      gap: "20px",
      padding: "20px",
      background: "linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)",
      borderRadius: "8px",
      color: "#fff",
    }}>
      {/* Left: Category Navigation */}
      <div
        style={{
          flex: "0 0 150px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <div style={{ fontSize: "12px", fontWeight: "bold", color: "#aaa", textTransform: "uppercase" }}>
          👜 Categories
        </div>
        {["hats", "shirts", "pants", "accessories"].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: "10px",
              background: selectedCategory === cat ? "#0e639c" : "#333",
              border: "1px solid #555",
              color: "#fff",
              borderRadius: "4px",
              cursor: "pointer",
              textTransform: "capitalize",
              transition: "all 0.2s",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Middle: Items Grid */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "12px", fontWeight: "bold", color: "#aaa", marginBottom: "12px", textTransform: "uppercase" }}>
          📦 Available Items ({filteredItems.length})
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: "12px",
            marginBottom: "12px",
          }}
        >
          {filteredItems.map((item) => (
            <div
              key={item.id}
              style={{
                background: "#2d2d2d",
                border: isOwned(item.id) ? "2px solid #00ff00" : "1px solid #555",
                borderRadius: "6px",
                padding: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                opacity: isOwned(item.id) ? 0.7 : 1,
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "60px",
                  background: "#333",
                  borderRadius: "4px",
                  border: "1px solid rgba(0,0,0,0.2)",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "cover",
                  }}
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              </div>
              <div style={{ fontSize: "11px", fontWeight: "bold" }}>
                {item.name}
                {isOwned(item.id) && " ✓"}
              </div>
              <div style={{ fontSize: "10px", color: "#aaa" }}>
                💰 {item.price} DT
              </div>
              <div style={{ fontSize: "9px", color: "#94a3b8" }}>
                By: {item.creator}
              </div>
              <button
                onClick={() => handlePurchase(item)}
                disabled={isOwned(item.id) || purchasing}
                style={{
                  padding: "6px",
                  background: isOwned(item.id) ? "#555" : "#0e639c",
                  border: "none",
                  color: "#fff",
                  borderRadius: "3px",
                  cursor: isOwned(item.id) || purchasing ? "not-allowed" : "pointer",
                  fontSize: "10px",
                  fontWeight: "bold",
                  opacity: isOwned(item.id) ? 0.6 : 1,
                }}
              >
                {isOwned(item.id) ? "✓ Owned" : "Buy"}
              </button>
            </div>
          ))}
        </div>

        {/* Notification */}
        {notification && (
          <div
            style={{
              padding: "8px 12px",
              background: "#1e1e1e",
              border: "1px solid #0e639c",
              borderRadius: "4px",
              fontSize: "11px",
              color: notification.includes("❌") ? "#ff6b6b" : "#86efac",
            }}
          >
            {notification}
          </div>
        )}
      </div>

      {/* Right: Wallet */}
      <div
        style={{
          flex: "0 0 180px",
          background: "#1a1a1a",
          border: "1px solid #444",
          borderRadius: "6px",
          padding: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <div style={{ fontSize: "12px", fontWeight: "bold", color: "#aaa", textTransform: "uppercase" }}>
          💰 Wallet
        </div>

        <div style={{ background: "#0e639c", borderRadius: "4px", padding: "12px", textAlign: "center" }}>
          <div style={{ fontSize: "10px", color: "#cbd5e1", marginBottom: "4px" }}>Balance</div>
          <div style={{ fontSize: "20px", fontWeight: "bold", color: "#00ff00" }}>
            {userTokens} DT
          </div>
        </div>

        <div style={{ fontSize: "11px", color: "#94a3b8" }}>
          📦 Owned: {ownedItems.length} items
        </div>
      </div>
    </div>
  );
}
