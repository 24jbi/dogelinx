import React, { useState } from "react";
import { useStudio } from "../store.js";

export default function VersionHistory() {
  const {
    snapshots,
    restoreSnapshot,
    deleteSnapshot,
    createSnapshot,
  } = useStudio();

  const [snapshotName, setSnapshotName] = useState("");

  const handleCreateSnapshot = () => {
    const name = snapshotName.trim() || `Snapshot ${snapshots.length + 1}`;
    createSnapshot(name);
    setSnapshotName("");
    alert(`Snapshot created: ${name}`);
  };

  const handleRestore = (snapshotId) => {
    if (confirm("Restore this snapshot? Current changes will be lost.")) {
      const success = restoreSnapshot(snapshotId);
      if (success) {
        alert("Snapshot restored successfully!");
      }
    }
  };

  const handleDelete = (snapshotId) => {
    if (confirm("Delete this snapshot permanently?")) {
      deleteSnapshot(snapshotId);
      alert("Snapshot deleted");
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="version-history" style={{ padding: "16px" }}>
      <h2 style={{ margin: "0 0 16px 0", color: "#e5e7eb", fontSize: "16px" }}>
        Version History ({snapshots.length})
      </h2>

      {/* Create Snapshot */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "16px",
          padding: "12px",
          backgroundColor: "#111827",
          borderRadius: "4px",
          border: "1px solid #374151",
        }}
      >
        <input
          type="text"
          value={snapshotName}
          onChange={(e) => setSnapshotName(e.target.value)}
          placeholder="Snapshot name (optional)"
          style={{
            flex: 1,
            padding: "6px 8px",
            backgroundColor: "#1f2937",
            border: "1px solid #374151",
            color: "#e5e7eb",
            borderRadius: "4px",
            fontSize: "12px",
          }}
          onKeyPress={(e) => {
            if (e.key === "Enter") handleCreateSnapshot();
          }}
        />
        <button
          onClick={handleCreateSnapshot}
          className="dlx-btn"
          style={{ fontSize: "12px", padding: "6px 12px" }}
        >
          📸 Save Version
        </button>
      </div>

      {/* Snapshots List */}
      <div style={{ maxHeight: "500px", overflowY: "auto" }}>
        {snapshots.length === 0 ? (
          <p style={{ color: "#6b7280", fontSize: "12px", textAlign: "center", padding: "20px" }}>
            No snapshots yet. Create one to save version history!
          </p>
        ) : (
          snapshots
            .slice()
            .reverse()
            .map((snap, idx) => (
              <div
                key={snap.id}
                style={{
                  padding: "12px",
                  marginBottom: "8px",
                  backgroundColor: "#111827",
                  border: "1px solid #374151",
                  borderRadius: "4px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#e5e7eb", fontSize: "12px", fontWeight: "500" }}>
                    {snap.name}
                  </div>
                  <div style={{ color: "#6b7280", fontSize: "11px", marginTop: "4px" }}>
                    {formatDate(snap.timestamp)} · {snap.objects?.length || 0} objects
                  </div>
                </div>

                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    onClick={() => handleRestore(snap.id)}
                    className="dlx-btn"
                    style={{
                      fontSize: "11px",
                      padding: "4px 8px",
                      backgroundColor: "#059669",
                    }}
                    title="Restore this snapshot"
                  >
                    ↻ Restore
                  </button>
                  <button
                    onClick={() => handleDelete(snap.id)}
                    className="dlx-btn danger"
                    style={{
                      fontSize: "11px",
                      padding: "4px 8px",
                    }}
                    title="Delete this snapshot"
                  >
                    ✕ Delete
                  </button>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
