import React, { useMemo, useRef, useState, useCallback } from "react";
import { useStudio, StudioRules } from "../store.js";
import { useUI } from "../uiStore.js";

const SCRIPT_CLASSES = new Set(["Script", "LocalScript", "ModuleScript"]);
const QUICK_INSERT = ["Folder", "Model", "Part", "Script", "LocalScript", "ModuleScript", "RemoteEvent", "ScreenGui", "Tool", "Sound", "Sky"];

function isDescendant(childrenMap, byId, maybeParentId, nodeId) {
  // returns true if maybeParentId is inside nodeId subtree (i.e. illegal to parent nodeId under maybeParentId)
  if (!maybeParentId) return false;
  if (maybeParentId === nodeId) return true;

  let cur = byId.get(maybeParentId);
  while (cur?.parentId) {
    if (cur.parentId === nodeId) return true;
    cur = byId.get(cur.parentId);
  }
  return false;
}

export default function Hierarchy() {
  const objects = useStudio((s) => s.objects);
  const selectedIds = useStudio((s) => s.selectedIds);
  const primaryId = useStudio((s) => s.primaryId);

  const selectOnly = useStudio((s) => s.selectOnly);
  const toggleSelect = useStudio((s) => s.toggleSelect);
  const setPrimary = useStudio((s) => s.setPrimary);

  const beginAction = useStudio((s) => s.beginAction);
  const commitAction = useStudio((s) => s.commitAction);
  const cancelAction = useStudio((s) => s.cancelAction);

  const renameNoHistory = useStudio((s) => s.renameNoHistory);
  const removeSelected = useStudio((s) => s.removeSelected);
  const duplicateInstance = useStudio((s) => s.duplicateInstance);
  const addInstance = useStudio((s) => s.addInstance);
  const moveInstance = useStudio((s) => s.moveInstance);
  const openScript = useStudio((s) => s.openScript);

  const openMenu = useUI((u) => u.openMenu);

  const [collapsed, setCollapsed] = useState(() => new Set());
  const [searchText, setSearchText] = useState("");

  // Rename buffer (commit once, not every keystroke)
  const [editingId, setEditingId] = useState(null);
  const [draftName, setDraftName] = useState("");

  // Drag state: keep in refs to avoid rerender spam on dragover
  const dragRef = useRef({ source: null, target: null });
  const [dragOverId, setDragOverId] = useState(null);

  const { roots, childrenMap, byId, filteredIds } = useMemo(() => {
    const byId = new Map(objects.map((o) => [o.id, o]));
    const childrenMap = new Map();

    for (const o of objects) {
      const p = o.parentId ?? null;
      if (!childrenMap.has(p)) childrenMap.set(p, []);
      childrenMap.get(p).push(o.id);
    }

    // Sort children: services first, then name, then className
    for (const [p, kids] of childrenMap.entries()) {
      kids.sort((a, b) => {
        const A = byId.get(a);
        const B = byId.get(b);
        if (!A || !B) return 0;
        const as = A.isService ? 0 : 1;
        const bs = B.isService ? 0 : 1;
        if (as !== bs) return as - bs;

        const an = (A.name || "").toLowerCase();
        const bn = (B.name || "").toLowerCase();
        if (an !== bn) return an < bn ? -1 : 1;

        const ac = (A.className || "").toLowerCase();
        const bc = (B.className || "").toLowerCase();
        return ac < bc ? -1 : ac > bc ? 1 : 0;
      });
    }

    // Search filter: include matches + all ancestors
    const filteredIds = new Set();
    const q = searchText.trim().toLowerCase();

    if (q) {
      for (const o of objects) {
        const n = (o.name || "").toLowerCase();
        const c = (o.className || "").toLowerCase();
        if (n.includes(q) || c.includes(q)) {
          filteredIds.add(o.id);
          let cur = o;
          while (cur?.parentId) {
            filteredIds.add(cur.parentId);
            cur = byId.get(cur.parentId);
          }
        }
      }
    }

    const roots = (childrenMap.get(null) || []).filter((id) => !q || filteredIds.has(id));
    return { roots, childrenMap, byId, filteredIds };
  }, [objects, searchText]);

  const searching = searchText.trim().length > 0;

  const toggleCollapse = useCallback((id) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const canHaveChildren = useCallback(
    (o) =>
      (childrenMap.get(o.id) || []).length > 0 ||
      (StudioRules.ALLOWED_CHILDREN[o.className] || []).length > 0,
    [childrenMap]
  );

  const insertMenuFor = useCallback(
    (target) => {
      const allowed = StudioRules.ALLOWED_CHILDREN[target.className] || [];
      const items = [];

      for (const c of QUICK_INSERT) {
        if (!allowed.includes(c)) continue;
        items.push({ label: `Insert ${c}`, onClick: () => addInstance(c, target.id) });
      }

      if (!items.length) items.push({ label: "No inserts allowed here", disabled: true });

      items.push({ label: "—" });

      if (!target.isService && !target.locked) {
        items.push({ label: "Duplicate", onClick: () => duplicateInstance(target.id) });
        items.push({
          label: "Delete",
          onClick: () => {
            selectOnly(target.id);
            removeSelected();
          },
        });
      } else {
        items.push({ label: "Duplicate", disabled: true });
        items.push({ label: "Delete", disabled: true });
      }

      return items;
    },
    [addInstance, duplicateInstance, removeSelected, selectOnly]
  );

  const startRename = useCallback(
    (o) => {
      if (o.isService || o.locked) return;
      beginAction("Rename");
      setEditingId(o.id);
      setDraftName(o.name || "");
    },
    [beginAction]
  );

  const commitRename = useCallback(() => {
    if (!editingId) return;
    renameNoHistory(editingId, draftName.trim() || "NewInstance");
    setEditingId(null);
    setDraftName("");
    commitAction();
  }, [editingId, draftName, renameNoHistory, commitAction]);

  const cancelRename = useCallback(() => {
    if (!editingId) return;
    setEditingId(null);
    setDraftName("");
    cancelAction();
  }, [editingId, cancelAction]);

  const tryMove = useCallback(
    (sourceId, targetIdOrNull) => {
      if (!sourceId) return;
      if (targetIdOrNull === sourceId) return;

      // Prevent parenting into your own descendants
      if (targetIdOrNull && isDescendant(childrenMap, byId, targetIdOrNull, sourceId)) return;

      moveInstance(sourceId, targetIdOrNull); // null => root
    },
    [moveInstance, childrenMap, byId]
  );

  const renderNode = (id, depth) => {
    const o = byId.get(id);
    if (!o) return null;

    const kids = (childrenMap.get(id) || []).filter((kid) => !searching || filteredIds.has(kid));
    const isSel = selectedIds.includes(o.id);
    const isPrimary = primaryId === o.id;

    // When searching, ignore collapsed so matches are visible
    const collapsedHere = !searching && collapsed.has(id);

    const isDragOver = dragOverId === id && dragRef.current.source && dragRef.current.source !== id;

    const draggable = !o.isService && !o.locked;

    return (
      <React.Fragment key={id}>
        <div
          draggable={draggable}
          onDragStart={(e) => {
            if (!draggable) {
              e.preventDefault();
              return;
            }
            dragRef.current = { source: o.id, target: null };
            e.dataTransfer.effectAllowed = "move";
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (!dragRef.current.source) return;

            // Only update state if target changed (prevents rerender spam)
            if (dragRef.current.target !== id) {
              dragRef.current.target = id;
              setDragOverId(id);
            }
            e.dataTransfer.dropEffect = "move";
          }}
          onDragLeave={() => {
            if (dragRef.current.target === id) {
              dragRef.current.target = null;
              setDragOverId(null);
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const src = dragRef.current.source;
            dragRef.current = { source: null, target: null };
            setDragOverId(null);
            if (src) tryMove(src, id);
          }}
          onDragEnd={() => {
            dragRef.current = { source: null, target: null };
            setDragOverId(null);
          }}
          onClick={(e) => {
            const multi = e.ctrlKey || e.metaKey;
            if (multi) toggleSelect(o.id);
            else selectOnly(o.id);
          }}
          onDoubleClick={() => {
            setPrimary(o.id);
            if (SCRIPT_CLASSES.has(o.className)) openScript(o.id);
            else startRename(o);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            if (!selectedIds.includes(o.id)) selectOnly(o.id);
            openMenu(e.clientX, e.clientY, insertMenuFor(o));
          }}
          style={{
            padding: "2px 6px",
            marginLeft: depth * 10,
            borderRadius: 4,
            cursor: "default",
            background: isSel
              ? isPrimary
                ? "#1e40af"
                : "#2563eb"
              : isDragOver
              ? "rgba(59, 130, 246, 0.25)"
              : "transparent",
            border: isPrimary
              ? "1px solid #3b82f6"
              : isSel
              ? "1px solid #2563eb"
              : isDragOver
              ? "1px dashed #3b82f6"
              : "1px solid transparent",
            display: "flex",
            gap: 6,
            alignItems: "center",
            transition: "all 90ms",
            opacity: dragRef.current.source === o.id ? 0.5 : 1,
            height: 22,
            minHeight: 22,
          }}
          title={o.isService ? "Service (locked)" : o.locked ? "Locked" : "Right click for options • Drag to reparent"}
        >
          {canHaveChildren(o) ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleCollapse(o.id);
              }}
              style={{
                width: 18,
                height: 18,
                padding: 0,
                borderRadius: 4,
                border: "1px solid #404854",
                background: "#2d3748",
                color: "#cbd5e1",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 900,
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
              title="Collapse/expand"
            >
              {collapsedHere ? "+" : "–"}
            </button>
          ) : (
            <div style={{ width: 18, flexShrink: 0 }} />
          )}

          {/* Name (editable) */}
          {editingId === o.id ? (
            <input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.currentTarget.blur();
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  cancelRename();
                }
              }}
              onBlur={() => commitRename()}
              autoFocus
              spellCheck={false}
              style={{
                width: "100%",
                background: "rgba(15,17,23,0.4)",
                color: "#fff",
                border: "1px solid #3b82f6",
                outline: "none",
                borderRadius: 4,
                padding: "2px 6px",
                fontWeight: 800,
                fontSize: 11,
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            />
          ) : (
            <div
              style={{
                flex: 1,
                minWidth: 0,
                color: isSel ? "#fff" : "#cbd5e1",
                fontWeight: isPrimary ? 900 : 700,
                fontSize: 11,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                startRename(o);
              }}
            >
              {o.name}
            </div>
          )}

          <div style={{ opacity: 0.55, fontSize: 9, whiteSpace: "nowrap" }}>{o.className}</div>
        </div>

        {!collapsedHere && kids.map((kid) => renderNode(kid, depth + 1))}
      </React.Fragment>
    );
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <input
        type="text"
        placeholder="Search…"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        spellCheck={false}
        style={{
          margin: "4px 6px",
          padding: "4px 6px",
          background: "#1a1f2e",
          border: "1px solid #2d3748",
          borderRadius: 4,
          color: "#cbd5e1",
          fontSize: 11,
          outline: "none",
          height: 24,
        }}
      />

      {/* Root drop zone */}
      <div
        style={{ padding: 10, overflow: "auto", flex: 1 }}
        onDragOver={(e) => {
          if (!dragRef.current.source) return;
          e.preventDefault();
          if (dragOverId !== null) setDragOverId(null);
          e.dataTransfer.dropEffect = "move";
        }}
        onDrop={(e) => {
          e.preventDefault();
          const src = dragRef.current.source;
          dragRef.current = { source: null, target: null };
          setDragOverId(null);
          if (src) tryMove(src, null);
        }}
      >
        {roots.map((id) => renderNode(id, 0))}
      </div>
    </div>
  );
}