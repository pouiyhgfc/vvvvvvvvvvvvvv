import { useRef } from "react";
import AreaDot from "../../ui/AreaDot.jsx";
import { bodyPreview, noteDay } from "../../lib/notes.js";
import DragHandle from "../../ui/DragHandle.jsx";
import Emoji from "../../ui/Emoji.jsx";
import Icon from "../../ui/Icon.jsx";
import { fmtDay } from "./noteHelpers.js";

// Eén notitiekaart, voor zowel de vastgezet-sectie als de rest. Long-press
// en klikken regelt LogbookView (selectiemodus, openen).
export default function NoteCard({
  areaOf,
  entry,
  idx,
  handleDown,
  selectMode,
  selected,
  canSort,
  moodEmoji,
  notebook,
  onClick,
  onToggleSelect,
  onLongPressStart,
  onLongPressEnd,
}) {
  const start = useRef(null);
  const isLog = entry._type === "log";
  const preview = bodyPreview(entry.body);
  const day = noteDay(entry);
  return (
    <div
      data-srow={isLog && canSort ? "1" : undefined}
      style={{
        background: "var(--card)",
        borderRadius: "var(--r-lg)",
        padding: "14px 16px 14px 18px",
        marginBottom: 10,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 12,
        outline: selected ? "2px solid var(--accent)" : "none",
      }}
      onPointerDown={(e) => {
        start.current = { x: e.clientX, y: e.clientY };
        if (isLog && !selectMode) onLongPressStart(entry.id);
      }}
      onPointerMove={(e) => {
        // Bewegen (scrollen) is geen ingedrukt houden.
        const p = start.current;
        if (p && Math.hypot(e.clientX - p.x, e.clientY - p.y) > 8) {
          start.current = null;
          onLongPressEnd();
        }
      }}
      onPointerUp={onLongPressEnd}
      onPointerLeave={onLongPressEnd}
      onPointerCancel={onLongPressEnd}
      onClick={onClick}
    >
      {isLog && selectMode && (
        <label
          onClick={(e) => e.stopPropagation()}
          style={{ display: "flex", flexShrink: 0, cursor: "pointer" }}
        >
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            aria-label="Selecteren"
            style={{ position: "absolute", opacity: 0, width: 1, height: 1 }}
          />
          <span
            aria-hidden="true"
            style={{
              width: 24,
              height: 24,
              borderRadius: 8,
              boxSizing: "border-box",
              border: selected ? "none" : "1.5px solid var(--control-border)",
              background: selected ? "var(--accent)" : "transparent",
              color: "var(--accent-contrast)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {selected && <Icon name="check" size={16} />}
          </span>
        </label>
      )}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: "var(--fs-xs)",
            fontWeight: 600,
            color: "var(--text-muted)",
          }}
        >
          {notebook && (
            <span
              style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  background: notebook.color,
                }}
              />
              {notebook.name} ·
            </span>
          )}
          {entry.pinnedAt && (
            <span style={{ color: "var(--accent-text)" }}>Vastgezet ·</span>
          )}
          <span>{fmtDay(day)}</span>
          {!isLog && <span>· Dagnotitie</span>}
          {!isLog && entry.mood && (
            <Emoji char={moodEmoji(entry.mood)} size={14} />
          )}
        </div>
        {entry.title && (
          <div
            dir="auto"
            style={{
              fontFamily: "var(--ff-head)",
              fontSize: "var(--fs-lg)",
              fontWeight: 600,
              color: "var(--text)",
            }}
          >
            {entry.title}
          </div>
        )}
        {preview && (
          <div
            dir="auto"
            style={{
              fontSize: "var(--fs-sm)",
              lineHeight: 1.45,
              color: "var(--text-muted)",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {preview}
          </div>
        )}
        {entry.tags?.length > 0 && (
          <div
            style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}
          >
            {entry.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: "var(--fs-xs)",
                  padding: "2px 8px",
                  borderRadius: "var(--r-pill)",
                  background: "var(--accent-bg)",
                  color: "var(--accent-text)",
                  fontWeight: 500,
                }}
              >
                {areaOf?.(tag) && <AreaDot color={areaOf(tag).color} />}
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      {isLog && canSort && (
        <div
          style={{ flexShrink: 0 }}
          onClick={(e) => e.stopPropagation()}
          // Slepen is geen long-press: de kaart mag hier geen selectie starten.
          onPointerDown={(e) => e.stopPropagation()}
        >
          <DragHandle onPointerDown={(e) => handleDown(e, idx, entry.id)} />
        </div>
      )}
    </div>
  );
}
