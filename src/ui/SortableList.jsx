import { FALLBACK_AREA_STYLE } from "../lib/constants.js";
import { useSortable } from "../hooks/useSortable.js";
import DragHandle from "./DragHandle.jsx";
import Emoji from "./Emoji.jsx";
import Icon from "./Icon.jsx";

// Weergave-only sorteerlijsten: slepen om te ordenen, tik op een rij om te
// bewerken (toevoegen/bewerken/verwijderen gebeurt in een Sheet, niet inline).
// Ze staan in een witte Section, dus rijen zijn gescheiden door een lijn.

function Row({ id, dragging, onHandleDown, onClick, icon, title, sub, right }) {
  return (
    <div
      data-srow="1"
      data-sid={id}
      className={dragging ? "dragging" : ""}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        minHeight: 56,
        background: "var(--card)",
        borderBottom: "1px solid var(--border-soft)",
      }}
    >
      <DragHandle onPointerDown={onHandleDown} />
      <button
        type="button"
        onClick={onClick}
        style={{
          flex: 1,
          minWidth: 0,
          minHeight: 56,
          display: "flex",
          alignItems: "center",
          gap: 12,
          border: "none",
          background: "transparent",
          padding: "8px 0",
          textAlign: "start",
          color: "var(--text)",
        }}
      >
        {icon}
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontSize: "var(--fs-md)" }}>
            {title}
          </span>
          {sub && (
            <span
              style={{
                display: "block",
                fontSize: "var(--fs-sm)",
                color: "var(--text-muted)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {sub}
            </span>
          )}
        </span>
        {right}
        <Icon
          name="caret-right"
          size={18}
          style={{ color: "var(--text-faint)", flexShrink: 0 }}
        />
      </button>
    </div>
  );
}

const dot = (color) => (
  <span
    aria-hidden="true"
    style={{
      width: 10,
      height: 10,
      borderRadius: 5,
      background: color,
      flexShrink: 0,
    }}
  />
);

const muted = {
  fontSize: "var(--fs-sm)",
  color: "var(--text-muted)",
  flexShrink: 0,
};

export function SortableTemplateList({ items, onReorder, onEdit }) {
  const { ref, dragId, onHandleDown } = useSortable(onReorder);
  if (items.length === 0) return null;
  return (
    <div ref={ref}>
      {items.map((t, i) => (
        <Row
          key={t.id}
          id={t.id}
          dragging={dragId === t.id}
          onHandleDown={(e) => onHandleDown(e, i, t.id)}
          onClick={() => onEdit(t)}
          icon={<Emoji char={t.icon} size={22} />}
          title={t.title}
          sub={t.desc}
          right={dot(t.color)}
        />
      ))}
    </div>
  );
}

export function SortableWeekTplList({ items, onReorder, onEdit }) {
  const { ref, dragId, onHandleDown } = useSortable(onReorder);
  if (items.length === 0) return null;
  return (
    <div ref={ref}>
      {items.map((tpl, i) => (
        <Row
          key={tpl.id}
          id={tpl.id}
          dragging={dragId === tpl.id}
          onHandleDown={(e) => onHandleDown(e, i, tpl.id)}
          onClick={() => onEdit(tpl)}
          icon={
            <Icon
              name="calendar-blank"
              size={22}
              style={{ color: "var(--text-muted)" }}
            />
          }
          title={tpl.name}
          right={
            <span style={muted}>
              {tpl.events.length} {tpl.events.length === 1 ? "blok" : "blokken"}
            </span>
          }
        />
      ))}
    </div>
  );
}

export function SortableRoutineList({ items, onReorder, onEdit, areaStyles }) {
  const { ref, dragId, onHandleDown } = useSortable(onReorder);
  return (
    <div ref={ref}>
      {items.map((r, i) => {
        const a = (areaStyles && areaStyles[r.area]) || FALLBACK_AREA_STYLE;
        return (
          <Row
            key={r.id}
            id={r.id}
            dragging={dragId === r.id}
            onHandleDown={(e) => onHandleDown(e, i, r.id)}
            onClick={() => onEdit(r)}
            icon={<Emoji char={r.icon} size={22} />}
            title={r.name}
            sub={r.desc}
            right={
              <span
                style={{
                  ...muted,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {dot(a.border)}
                {r.area}
              </span>
            }
          />
        );
      })}
    </div>
  );
}
