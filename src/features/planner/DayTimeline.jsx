import { useEffect, useRef, useState } from "react";
import { CAL_START_H, CAL_END_H, EVENT_COLORS } from "../../lib/constants.js";
import { dk, isToday, tMin } from "../../lib/date.js";
import { buzz } from "../../lib/storage.js";
import Icon from "../../ui/Icon.jsx";
import {
  durationMin,
  isRecurring,
  layoutOverlaps,
  movedTimes,
  resizedEnd,
  snap,
} from "./planner.js";

const HOUR_H = 64;
const LONG_PRESS_MS = 300;
const START = CAL_START_H * 60;
const END = CAL_END_H * 60;
const yOf = (min) => ((min - START) / 60) * HOUR_H;
const minOf = (px) => (px / HOUR_H) * 60;

// Eén brede tijdlijn voor een dag. Tik op een leeg stuk = nieuw blok op dat
// halfuur. Tik op een blok = bewerken. Ingedrukt houden = verslepen (per
// kwartier), het streepje onderaan = langer/korter maken.
export default function DayTimeline({
  date,
  events,
  onAdd,
  onEdit,
  onMove,
  onResize,
}) {
  const scrollRef = useRef(null);
  const press = useRef(null);
  const justDragged = useRef(false);
  const [drag, setDrag] = useState(null); // { id, kind, dy }
  const dayKey = dk(date);
  const firstStart = events.length
    ? Math.min(...events.map((e) => tMin(e.startTime)))
    : null;

  // Bij openen of een andere dag: scroll naar een uur voor nu (vandaag) of
  // net boven het eerste blok.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const now = new Date();
    const target = isToday(new Date(dayKey + "T12:00"))
      ? now.getHours() * 60 + now.getMinutes() - 60
      : (firstStart ?? 8 * 60) - 30;
    el.scrollTop = Math.max(0, yOf(target));
    // Alleen bij een andere dag, niet bij elke wijziging van een blok.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayKey]);

  // Tijdens slepen mag de pagina niet scrollen (anders breekt de browser de
  // sleep af met pointercancel).
  useEffect(() => {
    if (!drag) return undefined;
    const block = (e) => e.preventDefault();
    window.addEventListener("touchmove", block, { passive: false });
    return () => window.removeEventListener("touchmove", block);
  }, [drag]);

  const start = (e, occ, kind) => {
    if (e.button != null && e.button !== 0) return;
    const el = e.currentTarget;
    const p = {
      occ,
      kind,
      startY: e.clientY,
      dragging: false,
      pid: e.pointerId,
    };
    press.current = p;
    const begin = () => {
      p.dragging = true;
      try {
        el.setPointerCapture(p.pid);
      } catch {
        /* pointer al weg */
      }
      buzz();
      setDrag({ id: occ.id, kind, dy: 0 });
    };
    if (kind === "resize") begin();
    else p.timer = setTimeout(begin, LONG_PRESS_MS);
  };

  const move = (e) => {
    const p = press.current;
    if (!p) return;
    const dy = e.clientY - p.startY;
    if (!p.dragging) {
      // Bewegen vóór de long-press = scrollen, geen sleep.
      if (Math.abs(dy) > 8) {
        clearTimeout(p.timer);
        press.current = null;
      }
      return;
    }
    setDrag({ id: p.occ.id, kind: p.kind, dy });
  };

  const end = (e) => {
    const p = press.current;
    press.current = null;
    if (!p) return;
    clearTimeout(p.timer);
    if (!p.dragging) return;
    justDragged.current = true;
    const delta = minOf(e.clientY - p.startY);
    setDrag(null);
    if (Math.abs(snap(delta)) < 15) return;
    if (p.kind === "move") onMove(p.occ, movedTimes(p.occ, delta, START, END));
    else onResize(p.occ, { endTime: resizedEnd(p.occ, delta, END) });
  };

  const cancel = () => {
    if (press.current) clearTimeout(press.current.timer);
    press.current = null;
    setDrag(null);
  };

  const tapEmpty = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const min = START + snap(minOf(e.clientY - r.top), 30);
    onAdd(Math.min(END - 30, min));
  };

  const layout = layoutOverlaps(events);
  const hours = Array.from(
    { length: CAL_END_H - CAL_START_H },
    (_, i) => CAL_START_H + i,
  );
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  return (
    <div
      ref={scrollRef}
      style={{
        background: "var(--card)",
        borderRadius: "var(--r-lg)",
        maxHeight: "calc(100dvh - 330px)",
        minHeight: 280,
        overflowY: "auto",
        overscrollBehavior: "contain",
      }}
    >
      <div
        style={{
          position: "relative",
          height: (CAL_END_H - CAL_START_H) * HOUR_H,
        }}
      >
        {hours.map((h) => (
          <div
            key={h}
            style={{
              position: "absolute",
              top: yOf(h * 60),
              left: 0,
              right: 0,
              display: "flex",
              alignItems: "flex-start",
              pointerEvents: "none",
            }}
          >
            <span
              style={{
                width: 52,
                padding: "0 8px 0 0",
                marginTop: -8,
                textAlign: "right",
                fontSize: "var(--fs-xs)",
                color: "var(--text-muted)",
              }}
            >
              {h > CAL_START_H ? `${String(h).padStart(2, "0")}:00` : ""}
            </span>
            <span
              style={{ flex: 1, borderTop: "1px solid var(--border-soft)" }}
            />
          </div>
        ))}

        {/* Tikvlak voor nieuwe blokken; de blokken zelf liggen erboven. */}
        <div
          role="button"
          aria-label="Nieuw blok op dit tijdstip"
          onClick={tapEmpty}
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 52,
            right: 0,
          }}
        />

        {events.map((occ) => {
          const { col, totalCols } = layout.get(occ.id);
          const w = 100 / totalCols;
          const dur = durationMin(occ.startTime, occ.endTime);
          const active = drag?.id === occ.id ? drag : null;
          const shown =
            active?.kind === "move"
              ? movedTimes(occ, minOf(active.dy), START, END)
              : active?.kind === "resize"
                ? { ...occ, endTime: resizedEnd(occ, minOf(active.dy), END) }
                : occ;
          const top = yOf(tMin(shown.startTime));
          const height = Math.max(
            26,
            (durationMin(shown.startTime, shown.endTime) / 60) * HOUR_H - 2,
          );
          const c = occ.color || EVENT_COLORS[0];
          return (
            <div
              key={occ.id}
              data-event={occ.title}
              onPointerDown={(e) => start(e, occ, "move")}
              onPointerMove={move}
              onPointerUp={end}
              onPointerCancel={cancel}
              onClick={(e) => {
                e.stopPropagation();
                if (justDragged.current) {
                  justDragged.current = false;
                  return;
                }
                onEdit(occ);
              }}
              style={{
                position: "absolute",
                top: top + 1,
                height,
                left: `calc(52px + (100% - 60px) * ${(col * w) / 100})`,
                width: `calc((100% - 60px) * ${w / 100} - 4px)`,
                borderRadius: "var(--r-sm)",
                background: c + "26",
                borderLeft: `4px solid ${c}`,
                padding: "6px 8px",
                overflow: "hidden",
                cursor: "pointer",
                touchAction: "pan-y",
                userSelect: "none",
                WebkitUserSelect: "none",
                zIndex: active ? 20 : 2,
                boxShadow: active ? "var(--shadow-float)" : "none",
                transition: active ? "none" : "top .15s, height .15s",
              }}
            >
              <div
                dir="auto"
                style={{
                  fontSize: "var(--fs-sm)",
                  fontWeight: 600,
                  lineHeight: 1.25,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: height < 44 ? "nowrap" : "normal",
                }}
              >
                {occ.title}
              </div>
              {height >= 44 && (
                <div
                  style={{
                    fontSize: "var(--fs-xs)",
                    color: "var(--text-muted)",
                  }}
                >
                  {shown.startTime} – {shown.endTime}
                  {occ.desc && height >= 64 ? ` · ${occ.desc}` : ""}
                </div>
              )}
              {isRecurring(occ) && height >= 72 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    marginTop: 2,
                    fontSize: "var(--fs-xs)",
                    color: "var(--text-muted)",
                  }}
                >
                  <Icon name="repeat" size={14} />
                  {occ.repeat === "daily" ? "Elke dag" : "Elke week"}
                </div>
              )}
              {dur >= 30 && (
                <span
                  aria-label="Langer of korter maken"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    start(e, occ, "resize");
                  }}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: 16,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    touchAction: "none",
                    cursor: "ns-resize",
                  }}
                >
                  <span
                    style={{
                      width: 28,
                      height: 4,
                      borderRadius: 2,
                      background: c,
                      opacity: 0.5,
                    }}
                  />
                </span>
              )}
            </div>
          );
        })}

        {isToday(date) && nowMin >= START && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: yOf(nowMin),
              left: 48,
              right: 0,
              borderTop: "2px solid var(--accent)",
              zIndex: 10,
              pointerEvents: "none",
            }}
          >
            <span
              style={{
                position: "absolute",
                left: -4,
                top: -5,
                width: 8,
                height: 8,
                borderRadius: 4,
                background: "var(--accent)",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
