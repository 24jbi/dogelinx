// ===== COMMAND BAR WITH BUILDER PROMPT SYSTEM (IMPROVED) =====
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useStudio } from "../store.js";
import { useUI } from "../uiStore.js";
import { CommandParser, COMMAND_REGISTRY, executeBuilderCommand } from "../utils/CommandParser.js";

function isTypingInField(e) {
  const el = e.target;
  if (!el) return false;
  const tag = (el.tagName || "").toLowerCase();
  return tag === "input" || tag === "textarea" || el.isContentEditable;
}

export default function CommandBar() {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [showHelp, setShowHelp] = useState(false);

  const [lastMessage, setLastMessage] = useState("");
  const [messageShown, setMessageShown] = useState(false);

  const inputRef = useRef(null);
  const msgTimerRef = useRef(null);
  const suggTimerRef = useRef(null);

  // UI state
  const isOpen = useUI((u) => u.commandBarOpen);
  const setCommandBarOpen = useUI((u) => u.setCommandBarOpen);

  const commandHistory = useUI((u) => u.commandHistory);
  const addCommandToHistory = useUI((u) => u.addCommandToHistory);
  const historyIndex = useUI((u) => u.commandHistoryIndex);
  const setHistoryIndex = useUI((u) => u.setCommandHistoryIndex);

  // Parser builder: always uses the *latest* studio state, without subscribing the component to the whole store.
  const makeParser = useCallback(() => new CommandParser(useStudio.getState()), []);

  const close = useCallback(() => {
    setCommandBarOpen(false);
    setInput("");
    setSuggestions([]);
    setSelectedSuggestion(0);
    setShowHelp(false);
    setHistoryIndex(-1);
  }, [setCommandBarOpen, setHistoryIndex]);

  const open = useCallback(() => {
    setCommandBarOpen(true);
    setInput("");
    setSelectedSuggestion(0);
    setShowHelp(false);
    setHistoryIndex(-1);

    // seed suggestions immediately
    setSuggestions(COMMAND_REGISTRY.slice(0, 8));
  }, [setCommandBarOpen, setHistoryIndex]);

  const showMessage = useCallback((msg) => {
    setLastMessage(msg);
    setMessageShown(true);
    if (msgTimerRef.current) clearTimeout(msgTimerRef.current);
    msgTimerRef.current = setTimeout(() => setMessageShown(false), 2500);
  }, []);

  // Global keyboard shortcuts (ignores when typing in inputs)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don’t hijack typing in other fields
      if (isTypingInField(e) && !isOpen) return;

      // Open: Ctrl+K OR Shift+P OR Shift+F2
      const openHotkey =
        (e.ctrlKey && !e.shiftKey && !e.altKey && (e.key === "k" || e.key === "K")) ||
        (e.shiftKey && (e.key === "P" || e.key === "F2"));

      if (openHotkey) {
        e.preventDefault();
        open();
        return;
      }

      // Escape: close help first, then close bar
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        if (showHelp) setShowHelp(false);
        else close();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, open, close, showHelp]);

  // Focus input when opened
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => inputRef.current?.focus?.(), 0);
    return () => clearTimeout(t);
  }, [isOpen]);

  // Update suggestions (debounced)
  useEffect(() => {
    if (!isOpen || showHelp) return;

    if (suggTimerRef.current) clearTimeout(suggTimerRef.current);
    suggTimerRef.current = setTimeout(() => {
      const text = input.trim();

      if (!text) {
        setSuggestions(COMMAND_REGISTRY.slice(0, 8));
        setSelectedSuggestion(0);
        return;
      }

      try {
        const parser = makeParser();
        const filtered = parser.getSuggestions(text, 12) || [];
        setSuggestions(filtered);
        setSelectedSuggestion(0);
      } catch (err) {
        console.error(err);
        setSuggestions([]);
      }
    }, 60);

    return () => {
      if (suggTimerRef.current) clearTimeout(suggTimerRef.current);
    };
  }, [input, isOpen, showHelp, makeParser]);

  const groupedHelp = useMemo(() => {
    const grouped = {};
    for (const reg of COMMAND_REGISTRY) {
      if (!grouped[reg.cat]) grouped[reg.cat] = [];
      grouped[reg.cat].push(reg);
    }
    return grouped;
  }, []);

  const executeCommand = useCallback(
    (cmdStr) => {
      const raw = (cmdStr || "").trim();
      if (!raw) return;

      try {
        const parser = makeParser();
        const parsed = parser.parse(raw);

        if (parsed.type === "command") {
          const studio = useStudio.getState();
          const result = executeBuilderCommand(parsed, studio, null, null);

          if (result?.showHelp) {
            setShowHelp(true);
            return;
          }

          showMessage(result?.message || "Command executed");
          addCommandToHistory(raw);
          close();
          return;
        }

        if (parsed.type === "suggestion") {
          showMessage(parsed.reason || "Try a different command.");
          return;
        }

        showMessage("Unknown command. Type 'help' or press ? for commands.");
      } catch (err) {
        console.error(err);
        showMessage("Command failed. Check console.", "error");
      }
    },
    [addCommandToHistory, close, makeParser, showMessage]
  );

  const handleInputKeyDown = (e) => {
    // ? = help (like your placeholder says)
    if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      setShowHelp(true);
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const toExecute = suggestions[selectedSuggestion]?.cmd || input.trim();
      executeCommand(toExecute);
      return;
    }

    // Tab completes current selection
    if (e.key === "Tab") {
      if (suggestions.length > 0) {
        e.preventDefault();
        const cmd = suggestions[selectedSuggestion]?.cmd;
        if (cmd) setInput(cmd);
      }
      return;
    }

    // Arrow navigation
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (suggestions.length === 0) return;
      setSelectedSuggestion((idx) => (idx + 1) % suggestions.length);
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (suggestions.length === 0) return;
      setSelectedSuggestion((idx) => (idx - 1 + suggestions.length) % suggestions.length);
      return;
    }

    // History (Ctrl/Cmd+P/N)
    if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "P")) {
      e.preventDefault();
      if (commandHistory.length === 0) return;

      if (historyIndex === -1) {
        setHistoryIndex(0);
        setInput(commandHistory[0]);
        return;
      }

      if (historyIndex > 0) {
        const newIdx = historyIndex - 1;
        setHistoryIndex(newIdx);
        setInput(commandHistory[newIdx]);
      } else {
        setHistoryIndex(-1);
        setInput("");
      }
      return;
    }

    if ((e.ctrlKey || e.metaKey) && (e.key === "n" || e.key === "N")) {
      e.preventDefault();
      if (commandHistory.length === 0) return;

      if (historyIndex >= 0 && historyIndex < commandHistory.length - 1) {
        const newIdx = historyIndex + 1;
        setHistoryIndex(newIdx);
        setInput(commandHistory[newIdx]);
      } else {
        setHistoryIndex(-1);
        setInput("");
      }
      return;
    }
  };

  if (!isOpen) return null;

  // Help screen
  if (showHelp) {
    return (
      <div
        className="dlx-command-bar-overlay"
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <div className="dlx-command-bar dlx-command-help" style={{ position: "relative" }}>
          <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0, color: "#e5e7eb" }}>Command Help</h2>
            <button
              onClick={() => setShowHelp(false)}
              style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: 20 }}
              aria-label="Close help"
            >
              ✕
            </button>
          </div>

          <div style={{ maxHeight: "60vh", overflowY: "auto", fontSize: 12, lineHeight: 1.6 }}>
            {Object.entries(groupedHelp).map(([cat, cmds]) => (
              <div key={cat} style={{ marginBottom: 16 }}>
                <h3 style={{ color: "#60a5fa", margin: "8px 0", fontSize: 13, fontWeight: 700 }}>
                  {cat.toUpperCase()}
                </h3>
                {cmds.map((cmd) => (
                  <div key={cmd.cmd} style={{ marginBottom: 8, paddingLeft: 12, borderLeft: "2px solid #374151" }}>
                    <div style={{ color: "#d1d5db", fontFamily: "monospace", fontSize: 11 }}>{cmd.cmd}</div>
                    <div style={{ color: "#9ca3af", fontSize: 11 }}>{cmd.desc}</div>
                    <div style={{ color: "#6b7280", fontSize: 10, marginTop: 2 }}>Example: {cmd.example}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="dlx-command-bar-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="dlx-command-bar" style={{ position: "relative" }}>
        {/* Status message */}
        {messageShown && (
          <div
            style={{
              position: "absolute",
              bottom: -34,
              left: "50%",
              transform: "translateX(-50%)",
              background: "#1f2937",
              color: "#d1d5db",
              padding: "8px 12px",
              borderRadius: 8,
              fontSize: 12,
              whiteSpace: "nowrap",
              border: "1px solid #374151",
            }}
          >
            {lastMessage}
          </div>
        )}

        {/* Input */}
        <div className="dlx-command-input-wrapper">
          <span className="dlx-command-icon">{">"}</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleInputKeyDown}
            type="text"
            placeholder="Type command... Press ? for help, Tab to autocomplete, Ctrl+P/N for history"
            className="dlx-command-input"
            autoFocus
          />

          {commandHistory.length > 0 && (
            <span style={{ position: "absolute", right: 12, top: 12, color: "#6b7280", fontSize: 11 }}>
              {historyIndex >= 0 ? `↟ ${historyIndex + 1}/${commandHistory.length}` : ""}
            </span>
          )}
        </div>

        {/* Suggestions */}
        <div className="dlx-command-list">
          {suggestions.length > 0 ? (
            suggestions.map((r, i) => (
              <div
                key={r.cmd}
                className={`dlx-command-item ${i === selectedSuggestion ? "active" : ""}`}
                onMouseEnter={() => setSelectedSuggestion(i)}
                onClick={() => executeCommand(r.cmd)}
              >
                <div className="dlx-command-item-name">{r.cmd}</div>
                <div className="dlx-command-item-desc">{r.desc}</div>
              </div>
            ))
          ) : input.trim().length === 0 ? (
            <div style={{ padding: "12px 16px", color: "#6b7280", fontSize: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Popular commands:</div>
              {COMMAND_REGISTRY.slice(0, 8).map((r) => (
                <div
                  key={r.cmd}
                  style={{ padding: "4px 0", cursor: "pointer", color: "#9ca3af" }}
                  onClick={() => executeCommand(r.cmd)}
                >
                  {r.cmd}
                </div>
              ))}
              <div style={{ marginTop: 12, color: "#4b5563", fontSize: 11, lineHeight: 1.4 }}>
                <div>
                  <kbd>Ctrl+K</kbd>, <kbd>Shift+P</kbd>, or <kbd>Shift+F2</kbd> to open
                </div>
                <div>
                  <kbd>?</kbd> to open help
                </div>
                <div>
                  <kbd>Tab</kbd> to autocomplete
                </div>
                <div>
                  <kbd>Ctrl+P</kbd>/<kbd>N</kbd> for history
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: "12px 16px", color: "#6b7280", fontSize: 12 }}>
              No commands found. Press <kbd>?</kbd> for help.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}