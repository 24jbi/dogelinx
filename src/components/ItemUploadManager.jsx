import React, { useState, useEffect } from "react";

export default function ItemUploadManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    price: 50,
    category: "hats",
    file: null,
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [myItems, setMyItems] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("dogelinx_currentUser") || "null");
    setCurrentUser(user);
    if (user?.username) {
      loadMyItems(user.username);
    }
  }, []);

  const loadMyItems = async (username) => {
    try {
      const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
      const apiUrl = import.meta.env.VITE_API_URL || (isProduction ? 'https://veubc5rb.up.railway.app' : 'http://localhost:4000');
      const res = await fetch(`${apiUrl}/api/items/creator/${username}`);
      if (res.ok) {
        const data = await res.json();
        setMyItems(data.items || []);
      }
    } catch (err) {
      console.error("Error loading items:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, file: e.target.files?.[0] || null }));
  };

  const handleUpload = async () => {
    if (!formData.name.trim()) {
      setError("Item name is required");
      return;
    }
    if (!formData.price || formData.price <= 0) {
      setError("Price must be greater than 0");
      return;
    }
    if (!formData.file) {
      setError("Please select an image for your item");
      return;
    }

    if (!currentUser) {
      setError("You must be logged in to upload items");
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const fd = new FormData();
      fd.append("file", formData.file);
      fd.append("name", formData.name);
      fd.append("price", formData.price);
      fd.append("category", formData.category);
      fd.append("username", currentUser.username);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

      const res = await fetch(`${apiUrl}/api/items`, {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      setSuccess(true);
      setFormData({ name: "", price: 50, category: "hats", file: null });
      setTimeout(() => setSuccess(false), 3000);

      // Reload items
      if (currentUser?.username) {
        loadMyItems(currentUser.username);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: "16px" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: "10px 16px",
          background: "#2563eb",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontWeight: "bold",
          marginBottom: "12px",
        }}
      >
        {isOpen ? "📦 Close Item Creator" : "📦 Create & Sell Items"}
      </button>

      {isOpen && (
        <div
          style={{
            background: "#1a1f2e",
            border: "1px solid #2d3748",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "16px",
          }}
        >
          <h3 style={{ margin: "0 0 12px 0", color: "#e5e7eb" }}>
            Upload Avatar Item for Shop
          </h3>

          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", color: "#cbd5e1", fontSize: "12px", marginBottom: "4px" }}>
              Item Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Golden Crown"
              style={{
                width: "100%",
                padding: "8px",
                background: "#0f1219",
                border: "1px solid #404854",
                borderRadius: "4px",
                color: "#e5e7eb",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <div>
              <label style={{ display: "block", color: "#cbd5e1", fontSize: "12px", marginBottom: "4px" }}>
                Price (DT)
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                min="1"
                max="10000"
                style={{
                  width: "100%",
                  padding: "8px",
                  background: "#0f1219",
                  border: "1px solid #404854",
                  borderRadius: "4px",
                  color: "#e5e7eb",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", color: "#cbd5e1", fontSize: "12px", marginBottom: "4px" }}>
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                style={{
                  width: "100%",
                  padding: "8px",
                  background: "#0f1219",
                  border: "1px solid #404854",
                  borderRadius: "4px",
                  color: "#e5e7eb",
                  boxSizing: "border-box",
                }}
              >
                <option value="hats">Hats</option>
                <option value="shirts">Shirts</option>
                <option value="pants">Pants</option>
                <option value="accessories">Accessories</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", color: "#cbd5e1", fontSize: "12px", marginBottom: "4px" }}>
              Item Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{
                color: "#cbd5e1",
                fontSize: "12px",
              }}
            />
            {formData.file && (
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
                ✓ {formData.file.name}
              </div>
            )}
          </div>

          {error && (
            <div style={{ color: "#fca5a5", fontSize: "12px", marginBottom: "12px" }}>
              ❌ {error}
            </div>
          )}

          {success && (
            <div style={{ color: "#86efac", fontSize: "12px", marginBottom: "12px" }}>
              ✅ Item uploaded successfully! It's now in the shop.
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={uploading}
            style={{
              width: "100%",
              padding: "10px",
              background: uploading ? "#64748b" : "#10b981",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: uploading ? "not-allowed" : "pointer",
              fontWeight: "bold",
            }}
          >
            {uploading ? "Uploading..." : "Upload Item"}
          </button>
        </div>
      )}

      {myItems.length > 0 && (
        <div style={{ background: "#1a1f2e", border: "1px solid #2d3748", borderRadius: "8px", padding: "16px" }}>
          <h3 style={{ margin: "0 0 12px 0", color: "#e5e7eb" }}>My Items ({myItems.length})</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "12px" }}>
            {myItems.map((item) => (
              <div
                key={item.id}
                style={{
                  background: "#0f1219",
                  border: "1px solid #404854",
                  borderRadius: "6px",
                  padding: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "80px",
                    background: "#2d3748",
                    borderRadius: "4px",
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
                  />
                </div>
                <div style={{ fontSize: "11px", fontWeight: "bold", color: "#e5e7eb" }}>{item.name}</div>
                <div style={{ fontSize: "10px", color: "#94a3b8" }}>💰 {item.price} DT</div>
                <div style={{ fontSize: "10px", color: "#86efac" }}>
                  📊 {item.sales || 0} sales, 💸 {item.totalEarnings || 0} DT earned
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
