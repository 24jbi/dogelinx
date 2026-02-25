import React, { useMemo, useRef, useState, useEffect } from "react";
import Editor, { useMonaco } from "@monaco-editor/react";
import { useStudio } from "../store.js";
import { ROBLOX_GLOBALS, ROBLOX_COMPLETIONS, LUA_SNIPPETS, validateLuaSyntax, findUnknownGlobals } from "../utils/RobloxAPI.js";

export default function ScriptEditor() {
  const monaco = useMonaco();
  const objects = useStudio((s) => s.objects);
  const openScriptIds = useStudio((s) => s.openScriptIds);
  const activeScriptId = useStudio((s) => s.activeScriptId);
  const consoleLogs = useStudio((s) => s.consoleLogs);

  const setActiveScript = useStudio((s) => s.setActiveScript);
  const closeScript = useStudio((s) => s.closeScript);
  const setScriptSource = useStudio((s) => s.setScriptSource);
  const addLog = useStudio((s) => s.addLog);
  const clearLogs = useStudio((s) => s.clearLogs);

  const editorRef = useRef(null);
  const [minimapEnabled, setMinimapEnabled] = useState(false);
  const [outputPanelSize, setOutputPanelSize] = useState(150);
  const [isDraggingPanel, setIsDraggingPanel] = useState(false);

  const byId = useMemo(() => new Map(objects.map((o) => [o.id, o])), [objects]);
  const active = activeScriptId ? byId.get(activeScriptId) : null;

  // Setup Monaco language features (diagnostics, completion)
  useEffect(() => {
    if (!monaco) return;

    // Register completion provider
    const completionDisposable = monaco.languages.registerCompletionItemProvider("lua", {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endLineNumber: position.lineNumber,
          endColumn: word.endColumn,
        };

        // Combine snippets, keywords, and Roblox API completions
        const items = [
          // Lua snippets
          ...LUA_SNIPPETS.map((snippet) => ({
            label: snippet.label,
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: snippet.insertText,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: snippet.documentation,
            range,
            sortText: `1-${snippet.label}`,
          })),
          // Roblox API completions
          ...ROBLOX_COMPLETIONS.map((item) => ({
            label: item.label,
            kind:
              item.kind === "Method"
                ? monaco.languages.CompletionItemKind.Method
                : item.kind === "Class"
                ? monaco.languages.CompletionItemKind.Class
                : monaco.languages.CompletionItemKind.Function,
            insertText: item.insertText,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: item.documentation,
            range,
            sortText: `2-${item.label}`,
          })),
          // Global variables
          ...Object.keys(ROBLOX_GLOBALS).map((name) => ({
            label: name,
            kind: monaco.languages.CompletionItemKind.Variable,
            insertText: name,
            documentation: ROBLOX_GLOBALS[name].type || "Roblox global",
            range,
            sortText: `3-${name}`,
          })),
        ];

        return { suggestions: items };
      },
      triggerCharacters: [":", "."],
    });

    // Register diagnostics provider
    const diagnosticsDisposable = monaco.languages.registerCodeActionProvider("lua", {
      provideCodeActions: () => [],
    });

    // Update diagnostics when content changes
    const diagnosticsDisposable2 = monaco.editor.onDidCreateModel((model) => {
      if (model.getLanguageId() !== "lua") return;

      const updateDiagnostics = () => {
        const code = model.getValue();
        const syntaxErrors = validateLuaSyntax(code);
        const unknownGlobals = findUnknownGlobals(code);

        monaco.editor.setModelMarkers(model, "lua-validator", [...syntaxErrors, ...unknownGlobals]);
      };

      updateDiagnostics();
      const changeDisposable = model.onDidChangeContent(updateDiagnostics);

      return () => changeDisposable.dispose();
    });

    return () => {
      completionDisposable.dispose();
      diagnosticsDisposable.dispose();
      diagnosticsDisposable2.dispose();
    };
  }, [monaco]);

  const handleDragStart = (e) => {
    setIsDraggingPanel(true);
    document.addEventListener("mousemove", handleDrag);
    document.addEventListener("mouseup", handleDragEnd);
  };

  const handleDrag = (e) => {
    const newSize = Math.max(100, Math.min(500, window.innerHeight - e.clientY));
    setOutputPanelSize(newSize);
  };

  const handleDragEnd = () => {
    setIsDraggingPanel(false);
    document.removeEventListener("mousemove", handleDrag);
    document.removeEventListener("mouseup", handleDragEnd);
  };

  const handleEditorMount = (editor) => {
    editorRef.current = editor;
  };

  if (!openScriptIds.length) {
    return (
      <div style={{ padding: 12, opacity: 0.7 }}>
        Double-click a Script in Explorer to open it.
      </div>
    );
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, padding: 8, borderBottom: "1px solid rgba(255,255,255,0.08)", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 8, flex: 1, overflow: "auto" }}>
          {openScriptIds.map((id) => {
            const s = byId.get(id);
            if (!s) return null;
            const activeTab = id === activeScriptId;
            return (
              <div
                key={id}
                onClick={() => setActiveScript(id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 10px",
                  borderRadius: 10,
                  cursor: "pointer",
                  background: activeTab ? "rgba(147,197,253,0.20)" : "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  fontWeight: 800,
                  whiteSpace: "nowrap",
                }}
              >
                <span>{s.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeScript(id);
                  }}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "rgba(229,231,235,0.8)",
                    cursor: "pointer",
                    fontWeight: 900,
                    fontSize: 18,
                  }}
                  title="Close"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>

        {/* Toolbar */}
        <div style={{ display: "flex", gap: 4, borderLeft: "1px solid rgba(255,255,255,0.1)", paddingLeft: 8 }}>
          <button
            onClick={() => setMinimapEnabled(!minimapEnabled)}
            title={`${minimapEnabled ? "Hide" : "Show"} minimap (Alt+M)`}
            style={{
              padding: "6px 10px",
              background: minimapEnabled ? "rgba(147,197,253,0.3)" : "rgba(255,255,255,0.06)",
              color: "#cbd5e1",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            ⊟ Map
          </button>
          <button
            onClick={() => clearLogs()}
            title="Clear output (Ctrl+Shift+C)"
            style={{
              padding: "6px 10px",
              background: "rgba(255,255,255,0.06)",
              color: "#cbd5e1",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            🗑 Clear
          </button>
        </div>
      </div>

      {/* Editor + Output Split */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        {/* Editor */}
        <div style={{ flex: 1, minHeight: 0 }}>
          <Editor
            ref={editorRef}
            height="100%"
            theme="vs-dark"
            language="lua"
            value={active?.source ?? ""}
            onChange={(v) => active && setScriptSource(active.id, v ?? "")}
            onMount={handleEditorMount}
            options={{
              fontSize: 14,
              minimap: { enabled: minimapEnabled },
              wordWrap: "on",
              tabSize: 2,
              formatOnPaste: true,
              autoClosingBrackets: "always",
              autoSurround: "languageDefined",
              scrollBeyondLastLine: false,
              
              // Autocomplete
              suggestFontSize: 13,
              suggestLineHeight: 20,
              quickSuggestions: { other: true, comments: true, strings: true },
              quickSuggestionsDelay: 100,
              
              // Inline errors and warnings
              glyphMargin: true,
              lightbulb: { enabled: false },
              
              // Better readability
              lineHeight: 1.6,
              letterSpacing: 0.5,
              renderWhitespace: "none",
              
              // Selection and search
              selectionHighlight: true,
              occurrencesHighlight: true,
              
              // Scrollbar and minimap
              scrollbar: { vertical: "auto", horizontal: "auto" },
              
              // Comments
              comments: { lineComment: "--", blockComment: ["--[[", "]]"] },
            }}
          />
        </div>

        {/* Resize Handle */}
        <div
          onMouseDown={handleDragStart}
          style={{
            height: 4,
            background: isDraggingPanel ? "rgba(147,197,253,0.5)" : "rgba(100,116,139,0.3)",
            cursor: "row-resize",
            transition: isDraggingPanel ? "none" : "background 0.2s",
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}
        />

        {/* Output Panel */}
        <div
          style={{
            height: outputPanelSize,
            minHeight: 100,
            maxHeight: 500,
            display: "flex",
            flexDirection: "column",
            background: "#0f1219",
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {/* Output Header */}
          <div
            style={{
              padding: "8px 12px",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              fontSize: 12,
              fontWeight: 600,
              color: "#94a3b8",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>Output ({consoleLogs.length})</span>
            {consoleLogs.length > 0 && (
              <button
                onClick={() => clearLogs()}
                style={{
                  padding: "2px 6px",
                  background: "rgba(255,255,255,0.06)",
                  color: "#94a3b8",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 3,
                  cursor: "pointer",
                  fontSize: 11,
                }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Output Content */}
          <div
            style={{
              flex: 1,
              overflow: "auto",
              padding: "8px 12px",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            {consoleLogs.length === 0 ? (
              <div style={{ opacity: 0.5, fontSize: 12, color: "#94a3b8" }}>
                No output yet. Run scripts to see output here.
              </div>
            ) : (
              consoleLogs.map((log, i) => {
                let color = "#cbd5e1"; // default (log)
                let icon = "ℹ";
                if (log.level === "warn") {
                  color = "#eab308"; // yellow
                  icon = "⚠";
                }
                if (log.level === "error") {
                  color = "#ef4444"; // red
                  icon = "✕";
                }

                return (
                  <div key={i} style={{ color, marginBottom: 4, display: "flex", gap: 8 }}>
                    <span style={{ opacity: 0.6, minWidth: 20 }}>{icon}</span>
                    <div style={{ flex: 1 }}>
                      <span style={{ opacity: 0.7, fontSize: 11 }}>[{log.timestamp}]</span>
                      {log.source && (
                        <span style={{ opacity: 0.6, fontSize: 11, marginLeft: 8 }}>({log.source})</span>
                      )}
                      <div style={{ marginTop: 2 }}>{log.message}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Help text in bottom corner */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          right: 20,
          fontSize: 11,
          color: "rgba(148,163,184,0.5)",
          textAlign: "right",
          pointerEvents: "none",
        }}
      >
        <div>Ctrl+H: Find/Replace</div>
        <div>Ctrl+G: Go to Line</div>
        <div>Ctrl+/: Toggle Comment</div>
      </div>
    </div>
  );
}
