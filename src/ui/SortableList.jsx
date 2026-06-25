import { FALLBACK_AREA_STYLE } from "../lib/constants.js";
import { useSortable } from "../hooks/useSortable.js";
import DragHandle from "./DragHandle.jsx";
import Emoji from "./Emoji.jsx";

// Weergave-only sorteerlijsten: slepen om te ordenen, tik op een rij om te
// bewerken (toevoegen/bewerken/verwijderen gebeurt in een Sheet, niet inline).

const rowCard = (extra) => ({
  borderRadius: 8,
  background: "var(--card)",
  marginBottom: 4,
  boxShadow: "0 1px 2px var(--shadow)",
  overflow: "hidden",
  ...extra,
});
const rowInner = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 10px",
};
const tapArea = {
  flex: 1,
  minWidth: 0,
  display: "flex",
  alignItems: "center",
  gap: 8,
  cursor: "pointer",
};
const descStyle = {
  fontSize: 10,
  color: "var(--text-muted)",
  marginTop: 1,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};
const chevron = { fontSize: 16, color: "var(--text-faint)", flexShrink: 0 };

export function SortableTemplateList({ items, onReorder, onEdit }) {
  const { ref, dragId, onHandleDown } = useSortable(onReorder);
  if (items.length === 0) return null;
  return (
    <div ref={ref}>
      {items.map((t) => (
        <div
          key={t.id}
          data-srow="1"
          data-sid={t.id}
          style={rowCard({ borderLeft: `3px solid ${t.color}` })}
          className={dragId === t.id ? "dragging" : ""}
        >
          <div style={rowInner}>
            <DragHandle
              onPointerDown={(e) => onHandleDown(e, items.indexOf(t), t.id)}
            />
            <div style={tapArea} onClick={() => onEdit(t)}>
              <Emoji char={t.icon} size={18} />
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
                {t.desc && <div style={descStyle}>{t.desc}</div>}
              </div>
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  background: t.color,
                  flexShrink: 0,
                }}
              />
              <span style={chevron}>›</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SortableWeekTplList({ items, onReorder, onEdit }) {
  const { ref, dragId, onHandleDown } = useSortable(onReorder);
  if (items.length === 0) return null;
  return (
    <div ref={ref}>
      {items.map((tpl) => (
        <div
          key={tpl.id}
          data-srow="1"
          data-sid={tpl.id}
          style={rowCard({
            border: "1px solid var(--border)",
            marginBottom: 6,
          })}
          className={dragId === tpl.id ? "dragging" : ""}
        >
          <div style={{ ...rowInner, padding: "10px 12px" }}>
            <DragHandle
              onPointerDown={(e) => onHandleDown(e, items.indexOf(tpl), tpl.id)}
            />
            <div style={tapArea} onClick={() => onEdit(tpl)}>
              <Emoji char="📅" size={16} />
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
              <span style={chevron}>›</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SortableRoutineList({ items, onReorder, onEdit, areaStyles }) {
  const { ref, dragId, onHandleDown } = useSortable(onReorder);
  return (
    <div ref={ref}>
      {items.map((r) => {
        const a = (areaStyles && areaStyles[r.area]) || FALLBACK_AREA_STYLE;
        return (
          <div
            key={r.id}
            data-srow="1"
            data-sid={r.id}
            style={rowCard({
              borderLeft: `3px solid ${a.border}`,
              marginBottom: 3,
            })}
            className={dragId === r.id ? "dragging" : ""}
          >
            <div style={{ ...rowInner, gap: 6 }}>
              <DragHandle
                onPointerDown={(e) => onHandleDown(e, items.indexOf(r), r.id)}
              />
              <div style={tapArea} onClick={() => onEdit(r)}>
                <Emoji char={r.icon} size={17} />
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
                  {r.desc && <div style={descStyle}>{r.desc}</div>}
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
                <span style={chevron}>›</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
