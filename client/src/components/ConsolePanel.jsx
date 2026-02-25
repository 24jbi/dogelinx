import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useStudio } from "../store.js";

const LEVEL_COLOR = {
  log: "#d1d5db",
  info: "#d1d5db",
  warn: "#fbbf24",
  error: "#f87171",
};

function useAutoStickToBottom(deps) {
  const scrollerRef = useRef(null);
  const stickRef = useRef(true);

  const onScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
    stickRef.current = nearBottom;
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    if (stickRef.current) el.scrollTop = el.scrollHeight;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { scrollerRef, onScroll };
}

export default function ConsolePanel() {
  const [activeTab, setActiveTab] = useState("output"); // output | errors
  const [filter, setFilter] = useState("");
  const [level, setLevel] = useState("all"); // all | log | warn | error
  const [maxLines, setMaxLines] = useState(800);

  // IMPORTANT: only subscribe to the slices you need
  const consoleLogs = useStudio((s) => s.consoleLogs);
  const scriptErrors = useStudio((s) => s.scriptErrors);

  // OPTIONAL: if your store has these, it will use them. If not, it safely no-ops.
  const clearConsole = useStudio((s) => s.clearConsoleLogs || null);
  const clearErrors = useStudio((s) => s.clearScriptErrors || null);

  const filterLower = filter.trim().toLowerCase();

  const trimmedLogs = useMemo(() => {
    // hard cap to keep UI fast even if store grows
    const start = Math.max(0, consoleLogs.length - maxLines);
    return consoleLogs.slice(start);
  }, [consoleLogs, maxLines]);

  const filteredLogs = useMemo(() => {
    let list = trimmedLogs;

    if (level !== "all") list = list.filter((l) => (l.level || "log") === level);

    if (filterLower) {
      list = list.filter((l) => `${l.message ?? ""}`.toLowerCase().includes(filterLower));
    }

    return list;
  }, [trimmedLogs, level, filterLower]);

  const filteredErrors = useMemo(() => {
    let list = scriptErrors;
    if (filterLower) {
      list = list.filter((e) => {
        const hay = `${e.scriptName ?? ""}:${e.line ?? ""} ${e.message ?? ""}`.toLowerCase();
        return hay.includes(filterLower);
      });
    }
    // cap errors too
    const start = Math.max(0, list.length - maxLines);
    return list.slice(start);
  }, [scriptErrors, filterLower, maxLines]);

  const outputAuto = useAutoStickToBottom([activeTab, filteredLogs.length]);
  const errorsAuto = useAutoStickToBottom([activeTab, filteredErrors.length]);

  const copyVisible = useCallback(async () => {
    try {
      const text =
        activeTab === "output"
          ? filteredLogs
              .map((l) => `[${l.timestamp ?? ""}] ${(l.level || "log").toUpperCase()} ${l.message ?? ""}`)
              .join("\n")
          : filteredErrors
              .map((e) => `${e.scriptName ?? "?"}:${e.line ?? "?"} ${e.message ?? ""}`)
              .join("\n");
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error(err);
    }
  }, [activeTab, filteredLogs, filteredErrors]);

  const tabStyle = useCallback(
    (isActive) => ({
      padding: "4px 10px",
      background: isActive ? "#1f2937" : "transparent",
      border: "none",
      borderRight: "1px solid #1f2937",
      color: isActive ? "#60a5fa" : "#9ca3af",
      cursor: "pointer",
      fontSize: "11px",
      fontWeight: isActive ? "700" : "500",
      height: "26px",
      display: "flex",
      alignItems: "center",
    }),
    []
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "#0f1117",
        fontFamily: "Menlo, Monaco, monospace",
        fontSize: "11px",
      }}
    >
      {/* Tabs + toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "#0a0f1f",
          borderBottom: "1px solid #1f2937",
          paddingRight: 8,
        }}
      >
        <button onClick={() => setActiveTab("output")} style={tabStyle(activeTab === "output")}>
          🖨️ Output
        </button>
        <button onClick={() => setActiveTab("errors")} style={tabStyle(activeTab === "errors")}>
          ⚠️ Errors ({scriptErrors.length})
        </button>

        <div style={{ flex: 1 }} />

        {/* filter */}
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter…"
          style={{
            width: 180,
            padding: "4px 8px",
            borderRadius: 6,
            border: "1px solid #243044",
            background: "#0f1219",
            color: "#cbd5e1",
            outline: "none",
            fontSize: 11,
          }}
        />

        {/* level (output only) */}
        {activeTab === "output" && (
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            style={{
              padding: "4px 6px",
              borderRadius: 6,
              border: "1px solid #243044",
              background: "#0f1219",
              color: "#cbd5e1",
              fontSize: 11,
            }}
          >
            <option value="all">All</option>
            <option value="log">Log</option>
            <option value="warn">Warn</option>
            <option value="error">Error</option>
          </select>
        )}

        {/* max lines */}
        <select
          value={maxLines}
          onChange={(e) => setMaxLines(Number(e.target.value))}
          style={{
            padding: "4px 6px",
            borderRadius: 6,
            border: "1px solid #243044",
            background: "#0f1219",
            color: "#cbd5e1",
            fontSize: 11,
          }}
          title="Max visible lines"
        >
          <option value={200}>200</option>
          <option value={500}>500</option>
          <option value={800}>800</option>
          <option value={1500}>1500</option>
        </select>

        <button
          onClick={copyVisible}
          style={{
            padding: "4px 8px",
            borderRadius: 6,
            border: "1px solid #243044",
            background: "#0f1219",
            color: "#cbd5e1",
            cursor: "pointer",
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          Copy
        </button>

        <button
          onClick={() => {
            if (activeTab === "output") clearConsole?.();
            else clearErrors?.();
          }}
          style={{
            padding: "4px 8px",
            borderRadius: 6,
            border: "1px solid #243044",
            background: "#0f1219",
            color: "#cbd5e1",
            cursor: "pointer",
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          Clear
        </button>
      </div>

      {/* Output */}
      {activeTab === "output" && (
        <div
          ref={outputAuto.scrollerRef}
          onScroll={outputAuto.onScroll}
          style={{
            flex: 1,
            overflow: "auto",
            padding: "6px 8px",
            background: "#0a0f1f",
            color: "#d1d5db",
            lineHeight: 1.45,
          }}
        >
          {filteredLogs.length === 0 ? (
            <div style={{ color: "#6b7280", fontSize: 10 }}>Output will appear here…</div>
          ) : (
            filteredLogs.map((log, i) => (
              <div
                key={`${log.timestamp ?? "t"}_${i}`}
                style={{
                  marginBottom: 1,
                  color: LEVEL_COLOR[log.level || "log"] || "#d1d5db",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
                title={(log.level || "log").toUpperCase()}
              >
                <span style={{ color: "#6b7280", marginRight: 6 }}>[{log.timestamp}]</span>
                {log.message}
              </div>
            ))
          )}
        </div>
      )}

      {/* Errors */}
      {activeTab === "errors" && (
        <div
          ref={errorsAuto.scrollerRef}
          onScroll={errorsAuto.onScroll}
          style={{
            flex: 1,
            overflow: "auto",
            padding: "6px 8px",
            background: "#0a0f1f",
            color: "#d1d5db",
          }}
        >
          {filteredErrors.length === 0 ? (
            <div style={{ color: "#6b7280", fontSize: 10 }}>No errors</div>
          ) : (
            filteredErrors.map((err, i) => (
              <div
                key={`${err.scriptName ?? "?"}:${err.line ?? "?"}:${i}`}
                style={{
                  padding: 6,
                  marginBottom: 6,
                  background: "rgba(244, 63, 94, 0.10)",
                  border: "1px solid #7f1d1d",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 10,
                }}
                onClick={() => {
                  // Later: hook into your script editor (open file at line).
                  // For now: copy error line to clipboard.
                  const text = `${err.scriptName ?? "?"}:${err.line ?? "?"} ${err.message ?? ""}`;
                  navigator.clipboard?.writeText?.(text);
                }}
                title="Click to copy"
              >
                <div style={{ color: "#f87171", fontWeight: 800 }}>
                  {err.scriptName}:{err.line}
                </div>
                <div style={{ color: "#fca5a5" }}>{err.message}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}