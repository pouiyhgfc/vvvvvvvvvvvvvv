import DragHandle from "../../ui/DragHandle.jsx";
import Emoji from "../../ui/Emoji.jsx";
import { fmtDay, tagColor } from "./noteHelpers.js";

const cardBase = {
  background: "var(--card)",
  borderRadius: 12,
  padding: 14,
  marginBottom: 8,
  boxShadow: "0 1px 3px var(--shadow)",
  cursor: "pointer",
};

// Eén notitiekaart, voor zowel de vastgezet-sectie als de rest. Long-press
// en klikken regelt LogbookView (selectiemodus, openen).
export default function NoteCard({
  entry,
  idx,
  handleDown,
  selectMode,
  selected,
  canSort,
  moodEmoji,
  onClick,
  onToggleSelect,
  onLongPressStart,
  onLongPressEnd,
}) {
  const isLog = entry._type === "log";
  return (
    <div
      data-srow={isLog && canSort ? "1" : undefined}
      style={{
        ...cardBase,
        display: "flex",
        alignItems: "flex-start",
        gap: 0,
        outline: selected ? "1.5px solid var(--accent)" : "none",
      }}
      onPointerDown={() => {
        if (isLog && !selectMode) onLongPressStart(entry.id);
      }}
      onPointerUp={onLongPressEnd}
      onPointerLeave={onLongPressEnd}
      onPointerCancel={onLongPressEnd}
      onClick={onClick}
    >
      {isLog && selectMode && (
        <div
          style={{ alignSelf: "center", marginRight: 8, flexShrink: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            style={{ width: 18, height: 18, cursor: "pointer" }}
            aria-label="Selecteren"
          />
        </div>
      )}
      {isLog && canSort && (
        <div
          style={{
            alignSelf: "center",
            marginRight: 2,
            flexShrink: 0,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <DragHandle onPointerDown={(e) => handleDown(e, idx, entry.id)} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap",
            marginBottom: 6,
          }}
        >
          {entry.pinnedAt && <Emoji char="📌" size={12} />}
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--text-muted)",
            }}
          >
            {fmtDay(
              entry.updatedAt ? entry.updatedAt.slice(0, 10) : entry.date,
            )}
          </span>
          {!isLog && (
            <span
              style={{
                fontSize: 9,
                padding: "1px 7px",
                borderRadius: 99,
                background: "var(--border-soft)",
                color: "var(--text-faint)",
                fontWeight: 600,
              }}
            >
              Dagnotitie
            </span>
          )}
          {!isLog && entry.mood && (
            <Emoji char={moodEmoji(entry.mood)} size={15} />
          )}
          <span style={{ flex: 1 }} />
          <span style={{ fontSize: 15, color: "var(--text-faint)" }}>›</span>
        </div>
        {entry.title && (
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: 3,
            }}
          >
            {entry.title}
          </div>
        )}
        {entry.tags?.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 4,
              flexWrap: "wrap",
              marginTop: 8,
            }}
          >
            {entry.tags.map((tag) => {
              const c = tagColor(tag);
              return (
                <span
                  key={tag}
                  style={{
                    fontSize: 10,
                    padding: "2px 8px",
                    borderRadius: 99,
                    background: c + "22",
                    color: c,
                    border: `1px solid ${c}44`,
                    fontWeight: 600,
                  }}
                >
                  #{tag}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
