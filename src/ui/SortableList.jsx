import { useState } from "react";
import { FALLBACK_AREA_STYLE, EVENT_COLORS } from "../lib/constants.js";
import { useSortable } from "../hooks/useSortable.js";
import DragHandle from "./DragHandle.jsx";
import EmojiPicker from "./EmojiPicker.jsx";

function EditRow({ r, period, onSave, onCancel, areaNames }) {
  const [name, setName] = useState(r.name);
  const [icon, setIcon] = useState(r.icon);
  const [area, setArea] = useState(r.area);
  const [desc, setDesc] = useState(r.desc || "");
  const [showEmoji, setShowEmoji] = useState(false);
  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        alignItems: "center",
        flexWrap: "wrap",
        flex: 1,
      }}
    >
      <button
        onClick={() => setShowEmoji(!showEmoji)}
        style={{ fontSize: 16, background: "none", padding: 2 }}
      >
        {icon}
      </button>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{
          flex: 1,
          minWidth: 80,
          padding: "4px 6px",
          borderRadius: 5,
          border: "1px solid var(--border)",
          fontSize: 12,
          outline: "none",
        }}
      />
      <select
        value={area}
        onChange={(e) => setArea(e.target.value)}
        style={{
          padding: "4px",
          borderRadius: 5,
          border: "1px solid var(--border)",
          fontSize: 10,
          background: "var(--card)",
        }}
      >
        {(areaNames || []).map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
        {area && !(areaNames || []).includes(area) && (
          <option value={area}>{area}</option>
        )}
      </select>
      <button
        onClick={() => onSave(period, r.id, name, icon, area, desc)}
        style={{
          fontSize: 10,
          color: "#059669",
          background: "var(--sel-bg)",
          padding: "3px 6px",
          borderRadius: 4,
          fontWeight: 600,
        }}
      >
        ✓
      </button>
      <button
        onClick={onCancel}
        style={{
          fontSize: 10,
          color: "var(--text-muted)",
          background: "var(--input-bg)",
          padding: "3px 6px",
          borderRadius: 4,
        }}
      >
        ✕
      </button>
      <input
        type="text"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder="Beschrijving (optioneel)..."
        style={{
          width: "100%",
          marginTop: 4,
          padding: "5px 8px",
          borderRadius: 5,
          border: "1px solid var(--border)",
          fontSize: 11,
          outline: "none",
        }}
      />
      {showEmoji && (
        <div style={{ width: "100%", marginTop: 4 }}>
          <EmojiPicker
            value={icon}
            onPick={(e) => {
              setIcon(e);
              setShowEmoji(false);
            }}
            size={26}
            height={130}
          />
        </div>
      )}
    </div>
  );
}

function EditCalTplRow({ t, onSave, onCancel }) {
  const [title, setTitle] = useState(t.title);
  const [icon, setIcon] = useState(t.icon);
  const [color, setColor] = useState(t.color);
  const [desc, setDesc] = useState(t.desc || "");
  const [showEmoji, setShowEmoji] = useState(false);
  const save = () => {
    if (!title.trim()) return;
    onSave({ ...t, title: title.trim(), icon, color, desc: desc.trim() });
  };
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 6,
          alignItems: "center",
        }}
      >
        <button
          onClick={() => setShowEmoji(!showEmoji)}
          style={{
            fontSize: 16,
            background: "none",
            padding: 2,
            flexShrink: 0,
          }}
        >
          {icon}
        </button>
        <input
          type="text"
          value={title}
          autoFocus
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              save();
            }
          }}
          style={{
            flex: 1,
            minWidth: 80,
            padding: "4px 7px",
            borderRadius: 5,
            border: "1px solid var(--border)",
            fontSize: 12,
            outline: "none",
          }}
        />
        <button
          onClick={save}
          style={{
            fontSize: 10,
            color: "#059669",
            background: "var(--sel-bg)",
            padding: "3px 6px",
            borderRadius: 4,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          ✓
        </button>
        <button
          onClick={onCancel}
          style={{
            fontSize: 10,
            color: "var(--text-muted)",
            background: "var(--input-bg)",
            padding: "3px 6px",
            borderRadius: 4,
            flexShrink: 0,
          }}
        >
          ✕
        </button>
      </div>
      <input
        type="text"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder="Beschrijving (optioneel)..."
        style={{
          width: "100%",
          marginBottom: 6,
          padding: "4px 7px",
          borderRadius: 5,
          border: "1px solid var(--border)",
          fontSize: 11,
          outline: "none",
        }}
      />
      <div
        style={{
          display: "flex",
          gap: 4,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {EVENT_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              background: c,
              border:
                color.toLowerCase() === c
                  ? "2.5px solid var(--text)"
                  : "2px solid transparent",
              flexShrink: 0,
            }}
          />
        ))}
        <label
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            flexShrink: 0,
            cursor: "pointer",
            position: "relative",
            overflow: "hidden",
            border: EVENT_COLORS.includes(color.toLowerCase())
              ? "1px dashed var(--border)"
              : "2.5px solid var(--text)",
            background: EVENT_COLORS.includes(color.toLowerCase())
              ? "conic-gradient(red,orange,yellow,lime,aqua,blue,magenta,red)"
              : color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {EVENT_COLORS.includes(color.toLowerCase()) && (
            <span style={{ fontSize: 10 }}>🎨</span>
          )}
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0,
              cursor: "pointer",
              border: "none",
              padding: 0,
            }}
          />
        </label>
      </div>
      {showEmoji && (
        <div style={{ marginTop: 6 }}>
          <EmojiPicker
            value={icon}
            onPick={(e) => {
              setIcon(e);
              setShowEmoji(false);
            }}
            size={24}
            height={120}
          />
        </div>
      )}
    </div>
  );
}

const BTN = {
  edit: {
    background: "var(--card2)",
    border: "1px solid var(--border)",
    color: "var(--text)",
    fontSize: 12,
    fontWeight: 600,
    padding: "6px 10px",
    borderRadius: 6,
  },
  danger: {
    background: "var(--danger-bg)",
    border: "1px solid var(--danger-border)",
    color: "#dc2626",
    fontSize: 12,
    fontWeight: 600,
    padding: "6px 10px",
    borderRadius: 6,
  },
  primary: {
    background: "#7c3aed",
    color: "white",
    fontSize: 11,
    fontWeight: 600,
    padding: "6px 10px",
    borderRadius: 6,
    border: "none",
  },
  success: {
    background: "#059669",
    color: "white",
    fontSize: 11,
    fontWeight: 600,
    padding: "6px 10px",
    borderRadius: 6,
    border: "none",
  },
};

export function SortableTemplateList({ items, onReorder, onDelete, onEdit }) {
  const { ref, dragId, onHandleDown } = useSortable(onReorder);
  const [editingId, setEditingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  if (items.length === 0) return null;
  return (
    <div ref={ref}>
      {items.map((t) => {
        const isEditing = editingId === t.id;
        const isExpanded = expandedId === t.id;
        return (
          <div
            key={t.id}
            data-srow="1"
            data-sid={t.id}
            style={{
              borderRadius: 8,
              background: isEditing ? "var(--card2)" : "var(--card)",
              borderLeft: `3px solid ${t.color}`,
              marginBottom: 4,
              boxShadow: "0 1px 2px var(--shadow)",
              overflow: "hidden",
            }}
            className={dragId === t.id ? "dragging" : ""}
          >
            {isEditing ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  padding: "8px 10px",
                }}
              >
                <DragHandle
                  onPointerDown={(e) => onHandleDown(e, items.indexOf(t), t.id)}
                />
                <EditCalTplRow
                  t={t}
                  onSave={(updated) => {
                    onEdit(updated);
                    setEditingId(null);
                    setExpandedId(null);
                  }}
                  onCancel={() => setEditingId(null)}
                />
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 10px",
                  }}
                >
                  <DragHandle
                    onPointerDown={(e) =>
                      onHandleDown(e, items.indexOf(t), t.id)
                    }
                  />
                  <span style={{ fontSize: 15 }}>{t.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--text)",
                      }}
                    >
                      {t.title}
                    </div>
                    {t.desc && (
                      <div
                        style={{
                          fontSize: 10,
                          color: "var(--text-muted)",
                          marginTop: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {t.desc}
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      background: t.color,
                      flexShrink: 0,
                    }}
                  />
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : t.id)}
                    style={{
                      fontSize: 16,
                      background: isExpanded ? "var(--sel-bg)" : "var(--card2)",
                      border: "1px solid var(--border)",
                      padding: "4px 9px",
                      borderRadius: 6,
                      color: "var(--text-muted)",
                      lineHeight: 1,
                    }}
                  >
                    ⋯
                  </button>
                </div>
                {isExpanded && (
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      padding: "0 10px 10px",
                      alignItems: "center",
                    }}
                  >
                    {confirmDeleteId === t.id ? (
                      <>
                        <span
                          style={{
                            flex: 1,
                            fontSize: 12,
                            color: "#dc2626",
                            fontWeight: 600,
                          }}
                        >
                          ⚠️ Zeker weten?
                        </span>
                        <button
                          onClick={() => {
                            onDelete(t.id);
                            setExpandedId(null);
                            setConfirmDeleteId(null);
                          }}
                          style={BTN.danger}
                        >
                          Ja
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          style={BTN.edit}
                        >
                          Nee
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingId(t.id);
                            setExpandedId(null);
                          }}
                          style={{ ...BTN.edit, flex: 1 }}
                        >
                          ✏️ Bewerken
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(t.id)}
                          style={BTN.danger}
                        >
                          🗑️ Verwijderen
                        </button>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function SortableWeekTplList({
  items,
  onReorder,
  onLoad,
  onReplace,
  onDelete,
  onRename,
}) {
  const { ref, dragId, onHandleDown } = useSortable(onReorder);
  const [editingId, setEditingId] = useState(null);
  const [draftName, setDraftName] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  if (items.length === 0) return null;
  return (
    <div ref={ref}>
      {items.map((tpl) => {
        const isEditing = editingId === tpl.id;
        const isExpanded = expandedId === tpl.id;
        return (
          <div
            key={tpl.id}
            data-srow="1"
            data-sid={tpl.id}
            style={{
              background: "var(--card)",
              borderRadius: 8,
              marginBottom: 6,
              boxShadow: "0 1px 2px var(--shadow)",
              border: "1px solid var(--border)",
              overflow: "hidden",
            }}
            className={dragId === tpl.id ? "dragging" : ""}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 12px",
              }}
            >
              <DragHandle
                onPointerDown={(e) =>
                  onHandleDown(e, items.indexOf(tpl), tpl.id)
                }
              />
              <span style={{ fontSize: 14 }}>📅</span>
              {isEditing ? (
                <>
                  <input
                    type="text"
                    value={draftName}
                    autoFocus
                    onChange={(e) => setDraftName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && draftName.trim()) {
                        onRename(tpl.id, draftName.trim());
                        setEditingId(null);
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: "4px 7px",
                      borderRadius: 5,
                      border: "1px solid var(--border)",
                      fontSize: 12,
                      outline: "none",
                    }}
                  />
                  <button
                    onClick={() => {
                      if (draftName.trim()) {
                        onRename(tpl.id, draftName.trim());
                        setEditingId(null);
                      }
                    }}
                    style={{
                      fontSize: 10,
                      color: "#059669",
                      background: "var(--sel-bg)",
                      padding: "3px 6px",
                      borderRadius: 4,
                      fontWeight: 600,
                    }}
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    style={{
                      fontSize: 10,
                      color: "var(--text-muted)",
                      background: "var(--input-bg)",
                      padding: "3px 6px",
                      borderRadius: 4,
                    }}
                  >
                    ✕
                  </button>
                </>
              ) : (
                <>
                  <span
                    style={{
                      flex: 1,
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--text)",
                    }}
                  >
                    {tpl.name}
                  </span>
                  <span style={{ fontSize: 9, color: "var(--text-faint)" }}>
                    {tpl.events.length} events
                  </span>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : tpl.id)}
                    style={{
                      fontSize: 16,
                      background: isExpanded ? "var(--sel-bg)" : "var(--card2)",
                      border: "1px solid var(--border)",
                      padding: "4px 9px",
                      borderRadius: 6,
                      color: "var(--text-muted)",
                      lineHeight: 1,
                    }}
                  >
                    ⋯
                  </button>
                </>
              )}
            </div>
            {isExpanded && !isEditing && (
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  padding: "0 12px 10px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={() => {
                    onLoad(tpl);
                    setExpandedId(null);
                  }}
                  style={{ ...BTN.primary, flex: 1 }}
                >
                  ➕ Toevoegen
                </button>
                <button
                  onClick={() => {
                    onReplace(tpl);
                    setExpandedId(null);
                  }}
                  style={{ ...BTN.success, flex: 1 }}
                >
                  🔄 Vervangen
                </button>
                <button
                  onClick={() => {
                    setDraftName(tpl.name);
                    setEditingId(tpl.id);
                    setExpandedId(null);
                  }}
                  style={BTN.edit}
                >
                  ✏️
                </button>
                {confirmDeleteId === tpl.id ? (
                  <>
                    <span
                      style={{
                        flex: 1,
                        fontSize: 12,
                        color: "#dc2626",
                        fontWeight: 600,
                      }}
                    >
                      ⚠️ Zeker weten?
                    </span>
                    <button
                      onClick={() => {
                        onDelete(tpl);
                        setExpandedId(null);
                        setConfirmDeleteId(null);
                      }}
                      style={BTN.danger}
                    >
                      Ja
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      style={BTN.edit}
                    >
                      Nee
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(tpl.id)}
                    style={BTN.danger}
                  >
                    🗑️
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function SortableRoutineList({
  period,
  items,
  editingId,
  setEditingId,
  onSave,
  onDelete,
  onReorder,
  areaStyles,
  areaNames,
}) {
  const { ref, dragId, onHandleDown } = useSortable(onReorder);
  const [expandedId, setExpandedId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  return (
    <div ref={ref}>
      {items.map((r) => {
        const isEditing = editingId === r.id;
        const isExpanded = expandedId === r.id;
        const a = (areaStyles && areaStyles[r.area]) || FALLBACK_AREA_STYLE;
        return (
          <div
            key={r.id}
            data-srow="1"
            data-sid={r.id}
            style={{
              borderRadius: 8,
              background: isEditing ? "var(--card2)" : "var(--card)",
              borderLeft: `3px solid ${a.border}`,
              marginBottom: 3,
              boxShadow: "0 1px 2px var(--shadow)",
              overflow: "hidden",
            }}
            className={dragId === r.id ? "dragging" : ""}
          >
            {isEditing ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 10px",
                }}
              >
                <EditRow
                  r={r}
                  period={period}
                  onSave={onSave}
                  onCancel={() => setEditingId(null)}
                  areaNames={areaNames}
                />
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 10px",
                  }}
                >
                  <DragHandle
                    onPointerDown={(e) =>
                      onHandleDown(e, items.indexOf(r), r.id)
                    }
                  />
                  <span style={{ fontSize: 14 }}>{r.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: "var(--text)",
                      }}
                    >
                      {r.name}
                    </div>
                    {r.desc && (
                      <div
                        style={{
                          fontSize: 10,
                          color: "var(--text-muted)",
                          marginTop: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {r.desc}
                      </div>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: 9,
                      padding: "1px 6px",
                      borderRadius: 99,
                      background: a.tag,
                      color: a.text,
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {r.area}
                  </span>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : r.id)}
                    style={{
                      fontSize: 16,
                      background: isExpanded ? "var(--sel-bg)" : "var(--card2)",
                      border: "1px solid var(--border)",
                      padding: "4px 9px",
                      borderRadius: 6,
                      color: "var(--text-muted)",
                      lineHeight: 1,
                    }}
                  >
                    ⋯
                  </button>
                </div>
                {isExpanded && (
                  <div
                    style={{ display: "flex", gap: 6, padding: "0 10px 8px" }}
                  >
                    <button
                      onClick={() => {
                        setEditingId(r.id);
                        setExpandedId(null);
                      }}
                      style={{ ...BTN.edit, flex: 1 }}
                    >
                      ✏️ Bewerken
                    </button>
                    {confirmDeleteId === r.id ? (
                      <>
                        <span
                          style={{
                            flex: 1,
                            fontSize: 12,
                            color: "#dc2626",
                            fontWeight: 600,
                          }}
                        >
                          ⚠️ Zeker weten?
                        </span>
                        <button
                          onClick={() => {
                            onDelete(period, r.id);
                            setExpandedId(null);
                            setConfirmDeleteId(null);
                          }}
                          style={BTN.danger}
                        >
                          Ja
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          style={BTN.edit}
                        >
                          Nee
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(r.id)}
                        style={BTN.danger}
                      >
                        🗑️ Verwijderen
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
