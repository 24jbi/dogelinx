import React, { useEffect, useMemo, useRef } from "react";

const LUA_KEYWORDS = [
  "and","break","do","else","elseif","end","false","for","function","goto","if",
  "in","local","nil","not","or","repeat","return","then","true","until","while",
  "print","require","assert","error","type","tostring","tonumber","table","string","math"
];

const KEYWORD_REGEX = new RegExp(`\\b(${LUA_KEYWORDS.join("|")})\\b`, "g");
const COMMENT_REGEX = /--.*$/gm;
const STRING_REGEX = /(["'`])(?:\\.|(?!\1)[^\\])*\1/g; // safer string matcher
const NUMBER_REGEX = /\b\d+\.?\d*\b/g;

function highlightCode(code) {
  const lines = (code || "").split("\n");
  return lines
    .map((line) => {
      let html = line
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

      // comments
      html = html.replace(COMMENT_REGEX, '<span style="color:#7cc576;">$&</span>');
      // strings
      html = html.replace(STRING_REGEX, '<span style="color:#f97316;">$&</span>');
      // numbers
      html = html.replace(NUMBER_REGEX, '<span style="color:#93c5fd;">$&</span>');
      // keywords
      html = html.replace(KEYWORD_REGEX, '<span style="color:#60a5fa;font-weight:600;">$1</span>');

      return html;
    })
    .join("\n");
}

function getLineStart(text, index) {
  const i = Math.max(0, Math.min(text.length, index));
  const nl = text.lastIndexOf("\n", i - 1);
  return nl === -1 ? 0 : nl + 1;
}

function getLineEnd(text, index) {
  const i = Math.max(0, Math.min(text.length, index));
  const nl = text.indexOf("\n", i);
  return nl === -1 ? text.length : nl;
}

function toggleCommentBlock(text, selStart, selEnd) {
  let start = selStart;
  let end = selEnd;

  // If selection ends at a newline, don't include the next empty line
  if (end > start && text[end - 1] === "\n") end -= 1;

  const blockStart = getLineStart(text, start);
  const blockEnd = getLineEnd(text, end);

  const block = text.slice(blockStart, blockEnd);
  const lines = block.split("\n");

  const isBlank = (l) => /^\s*$/.test(l);
  const isCommented = (l) => /^\s*--/.test(l);

  // If every non-blank line is commented, we UNCOMMENT. Else COMMENT.
  const shouldUncomment = lines.every((l) => isBlank(l) || isCommented(l));

  const newLines = lines.map((l) => {
    if (isBlank(l)) return l;

    if (shouldUncomment) {
      // remove one leading "--" after indent
      return l.replace(/^(\s*)--\s?/, "$1");
    }
    // add "-- " after indent
    return l.replace(/^(\s*)/, "$1-- ");
  });

  const newBlock = newLines.join("\n");
  const newText = text.slice(0, blockStart) + newBlock + text.slice(blockEnd);

  // Studio-like behavior: selection becomes the full toggled block
  const newSelStart = blockStart;
  const newSelEnd = blockStart + newBlock.length;

  return { newText, newSelStart, newSelEnd };
}

export default function LuaEditor({ value, onChange }) {
  const textareaRef = useRef(null);
  const preRef = useRef(null);
  const gutterRef = useRef(null);

  const html = useMemo(() => highlightCode(value || ""), [value]);
  const lineCount = useMemo(() => (value ? value.split("\n").length : 1), [value]);

  // scroll sync
  const syncScroll = () => {
    const ta = textareaRef.current;
    const pre = preRef.current;
    const gut = gutterRef.current;
    if (!ta || !pre || !gut) return;
    pre.scrollTop = ta.scrollTop;
    pre.scrollLeft = ta.scrollLeft;
    gut.scrollTop = ta.scrollTop;
  };

  useEffect(() => {
    // when value changes (typing), keep sync
    syncScroll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const onKeyDown = (e) => {
    const isToggle =
      (e.ctrlKey || e.metaKey) && (e.key === "/" || e.code === "Slash");

    if (!isToggle) return;

    e.preventDefault();

    const ta = textareaRef.current;
    if (!ta) return;

    const text = value || "";
    const selStart = ta.selectionStart ?? 0;
    const selEnd = ta.selectionEnd ?? selStart;

    const { newText, newSelStart, newSelEnd } = toggleCommentBlock(text, selStart, selEnd);

    onChange?.(newText);

    // restore selection AFTER React updates value
    requestAnimationFrame(() => {
      const t2 = textareaRef.current;
      if (!t2) return;
      t2.focus();
      t2.setSelectionRange(newSelStart, newSelEnd);
      syncScroll();
    });
  };

  const gutterWidth = 44; // tweak if you want

  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        borderRadius: 6,
        border: "1px solid #404854",
        overflow: "hidden",
        background: "#1a2033",
        display: "flex",
      }}
    >
      {/* Line numbers gutter */}
      <div
        ref={gutterRef}
        style={{
          width: gutterWidth,
          flexShrink: 0,
          background: "rgba(0,0,0,0.15)",
          borderRight: "1px solid rgba(64,72,84,0.8)",
          color: "#64748b",
          font: '12px/1.5 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          padding: "10px 8px",
          textAlign: "right",
          userSelect: "none",
          overflow: "hidden",
          whiteSpace: "pre",
        }}
      >
        {Array.from({ length: lineCount }, (_, i) => String(i + 1)).join("\n")}
      </div>

      {/* Code area */}
      <div style={{ position: "relative", flex: 1 }}>
        {/* real input */}
        <textarea
          ref={textareaRef}
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
          onKeyDown={onKeyDown}
          onScroll={syncScroll}
          spellCheck={false}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            padding: 10,
            border: "none",
            background: "transparent",
            color: "transparent",          // hide raw text
            caretColor: "#cbd5e1",         // keep caret visible
            font: '12px/1.5 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            outline: "none",
            resize: "none",
            zIndex: 2,
            overflow: "auto",
            whiteSpace: "pre",
          }}
        />

        {/* highlighted mirror */}
        <pre
          ref={preRef}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            padding: 10,
            margin: 0,
            background: "#1a2033",
            color: "#cbd5e1",
            font: '12px/1.5 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            overflow: "hidden", // scroll comes from textarea; we sync pre
            whiteSpace: "pre",
            pointerEvents: "none",
            zIndex: 1,
          }}
          dangerouslySetInnerHTML={{ __html: html || " " }}
        />
      </div>
    </div>
  );
}