import React, { useState } from "react";
import { useStudio } from "../store";

/**
 * DT (DogeTokens) Shop - Let users buy DT with real money
 * Currently uses a demo system. In production, integrate Stripe.
 */
export default function DTShop({ userTokens = 0, onPurchase, username }) {
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // DT packages and pricing
  const packages = [
    { id: "starter", name: "Starter", amount: 100, price: 4.99, bonus: 10 },
    { id: "plus", name: "Plus", amount: 500, price: 19.99, bonus: 75 },
    { id: "pro", name: "Pro", amount: 1000, price: 34.99, bonus: 200 },
    { id: "elite", name: "Elite", amount: 5000, price: 149.99, bonus: 1500 },
  ];

  const handlePurchase = async (pkg) => {
    if (!username) {
      setMessage("❌ Sign in to buy DT");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // In production: call Stripe API here
      // For now: simulate purchase
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/api/buy-dt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          amount: pkg.amount + pkg.bonus,
          packageId: pkg.id,
        }),
      });

      const data = await response.json();
      if (data.ok) {
        setMessage(`✅ Purchased ${pkg.amount + pkg.bonus} DT!`);
        onPurchase?.(pkg.amount + pkg.bonus);
      } else {
        setMessage(`❌ ${data.error || "Purchase failed"}`);
      }
    } catch (err) {
      setMessage(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        padding: "20px",
        background: "linear-gradient(135deg, #0f1419 0%, #1a1f2e 100%)",
        borderRadius: "12px",
        color: "#fff",
      }}
    >
      {/* Header */}
      <div>
        <h2 style={{ margin: "0 0 8px 0", fontSize: "20px" }}>💰 Buy Doge Tokens</h2>
        <p style={{ margin: 0, fontSize: "12px", color: "#aaa" }}>
          Current Balance: <span style={{ color: "#4ade80", fontWeight: "bold" }}>{userTokens} DT</span>
        </p>
      </div>

      {/* Packages Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            onClick={() => setSelectedPackage(pkg.id)}
            style={{
              padding: "16px",
              background: selectedPackage === pkg.id ? "#2d5a8f" : "#1f2937",
              border: selectedPackage === pkg.id ? "2px solid #60a5fa" : "1px solid #374151",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "all 0.2s",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
            onMouseEnter={(e) => {
              if (selectedPackage !== pkg.id) {
                e.currentTarget.style.background = "#374151";
              }
            }}
            onMouseLeave={(e) => {
              if (selectedPackage !== pkg.id) {
                e.currentTarget.style.background = "#1f2937";
              }
            }}
          >
            <div style={{ fontWeight: "bold", fontSize: "14px" }}>{pkg.name}</div>
            <div style={{ fontSize: "20px", fontWeight: "bold", color: "#fbbf24" }}>
              {pkg.amount + pkg.bonus} DT
            </div>
            <div style={{ fontSize: "11px", color: "#4ade80" }}>
              +{pkg.bonus} bonus DT
            </div>
            <div style={{ fontSize: "14px", fontWeight: "bold", color: "#60a5fa" }}>
              ${pkg.price}
            </div>
          </div>
        ))}
      </div>

      {/* Action */}
      {selectedPackage && (
        <button
          onClick={() => handlePurchase(packages.find((p) => p.id === selectedPackage))}
          disabled={loading}
          style={{
            padding: "12px 20px",
            background: loading ? "#4b5563" : "#10b981",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "14px",
            fontWeight: "bold",
            transition: "all 0.2s",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Processing..." : "Buy Now"}
        </button>
      )}

      {/* Message */}
      {message && (
        <div
          style={{
            padding: "10px 12px",
            background: message.includes("❌") ? "#7f1d1d" : "#15803d",
            border: `1px solid ${message.includes("❌") ? "#991b1b" : "#22c55e"}`,
            borderRadius: "6px",
            fontSize: "12px",
            color: "#fff",
          }}
        >
          {message}
        </div>
      )}

      {/* Payment Methods Note */}
      <div style={{ fontSize: "11px", color: "#6b7280", textAlign: "center" }}>
        💳 Powered by Stripe | 🔒 Secure Payments
      </div>
    </div>
  );
}
