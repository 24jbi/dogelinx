import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useUI } from "../uiStore.js";

const MENU_W = 220;
const ITEM_H = 34;

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

export default function ContextMenu() {
  const menu = useUI((u) => u.menu);
  const closeMenu = useUI((u) => u.closeMenu);

  const rootRef = useRef(null);
  const [hoverIdx, setHoverIdx] = useState(-1);

  // Build a list of “selectable” indices (not separators, not disabled)
  const selectable = useMemo(() => {
    if (!menu.open) return [];
    const out = [];
    (menu.items || []).forEach((it, i) => {
      const isSep = it.label === "—";
      const disabled = !!it.disabled;
      if (!isSep && !disabled) out.push(i);
    });
    return out;
  }, [menu.open, menu.items]);

  // Position (clamp to viewport)
  const [pos, setPos] = useState({ left: 0, top: 0 });

  useLayoutEffect(() => {
    if (!menu.open) return;

    // Measure menu height based on items
    const count = (menu.items || []).length;
    const estimatedH = clamp(count * ITEM_H + 12, 60, 420);

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const left = clamp(menu.x, 8, vw - MENU_W - 8);
    const top = clamp(menu.y, 8, vh - estimatedH - 8);

    setPos({ left, top });

    // reset hover to first selectable item
    setHoverIdx(selectable[0] ?? -1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menu.open, menu.x, menu.y, menu.items]);

  // Close on outside click + Esc, plus keyboard navigation
  useEffect(() => {
    if (!menu.open) return;

    const onPointerDown = (e) => {
      const root = rootRef.current;
      if (!root) return closeMenu();
      if (!root.contains(e.target)) closeMenu();
    };

    const moveHover = (dir) => {
      if (selectable.length === 0) return;
      const cur = hoverIdx;
      const curPos = selectable.indexOf(cur);
      const start = curPos === -1 ? 0 : curPos;
      const next = (start + dir + selectable.length) % selectable.length;
      setHoverIdx(selectable[next]);
    };

    const clickHover = () => {
      const idx = hoverIdx;
      if (idx < 0) return;
      const it = menu.items?.[idx];
      if (!it || it.label === "—" || it.disabled) return;
      closeMenu();
      it.onClick?.();
    };

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeMenu();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        moveHover(+1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        moveHover(-1);
      } else if (e.key === "Enter") {
        e.preventDefault();
        clickHover();
      }
    };

    window.addEventListener("pointerdown", onPointerDown, true); // capture = reliable outside click
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menu.open, menu.items, closeMenu, hoverIdx, selectable]);

  if (!menu.open) return null;

  return (
    <div
      ref={rootRef}
      style={{
        position: "fixed",
        left: pos.left,
        top: pos.top,
        width: MENU_W,
        background: "#1a1f2e",
        border: "1px solid #2d3748",
        borderRadius: 10,
        padding: 6,
        zIndex: 9999,
        boxShadow: "0 16px 50px rgba(0,0,0,0.6)",
        userSelect: "none",
      }}
      role="menu"
    >
      {(menu.items || []).map((it, idx) => {
        if (it.label === "—") {
          return <div key={idx} style={{ height: 1, background: "#2d3748", margin: "6px 0" }} />;
        }

        const disabled = !!it.disabled;
        const active = idx === hoverIdx && !disabled;

        return (
          <div
            key={idx}
            role="menuitem"
            aria-disabled={disabled ? "true" : "false"}
            onMouseEnter={() => setHoverIdx(idx)}
            onClick={() => {
              if (disabled) return;
              closeMenu();
              it.onClick?.();
            }}
            style={{
              padding: "8px 10px",
              borderRadius: 8,
              cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled ? 0.45 : 1,
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              color: "#cbd5e1",
              fontSize: 13,
              background: active ? "#2563eb" : "transparent",
            }}
          >
            <span>{it.label}</span>
            <span style={{ opacity: 0.55, fontSize: 11 }}>{it.shortcut || ""}</span>
          </div>
        );
      })}
    </div>
  );
}