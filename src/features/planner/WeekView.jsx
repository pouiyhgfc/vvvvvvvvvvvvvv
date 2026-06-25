import { useState, useEffect, useRef } from "react";
import {
  dk,
  getMonday,
  isToday,
  uid,
  eventsOnDate,
  applyWeekTemplate,
  tMin,
  minT,
} from "../../lib/date.js";
import {
  MONTHS_NL,
  WEEK_DAYS_SHORT,
  CAL_HOUR_H,
  CAL_START_H,
  CAL_END_H,
} from "../../lib/constants.js";
import EventModal from "./EventModal.jsx";
import Emoji from "../../ui/Emoji.jsx";

// Assign a column slot to each event so overlapping events sit side by side.
// Returns Map<id, {col, totalCols}>.
function layoutOverlaps(events) {
  if (events.length === 0) return new Map();
  const sorted = [...events].sort(
    (a, b) => tMin(a.startTime) - tMin(b.startTime),
  );
  const colEnds = [];
  const placed = sorted.map((ev) => {
    const start = tMin(ev.startTime);
    let end = tMin(ev.endTime);
    if (end <= start) end += 1440; // midnight-spanning events
    let col = 0;
    while (col < colEnds.length && colEnds[col] > start) col++;
    if (col === colEnds.length) colEnds.push(end);
    else colEnds[col] = end;
    return { ev, col, start, end };
  });
  const result = new Map();
  for (const item of placed) {
    let maxCol = item.col;
    for (const other of placed) {
      if (other !== item && other.start < item.end && other.end > item.start)
        maxCol = Math.max(maxCol, other.col);
    }
    result.set(item.ev.id, { col: item.col, totalCols: maxCol + 1 });
  }
  return result;
}

// left/right style for a column slot; 2px outer margin, 4px gap between events.
function colStyle(col, totalCols) {
  if (totalCols === 1) return { left: 2, right: 2 };
  const w = 100 / totalCols;
  return {
    left: `calc(${col * w}% + 2px)`,
    right: `calc(${(totalCols - col - 1) * w}% + 2px)`,
  };
}

export default function WeekView({
  date,
  calTemplates,
  calEvents,
  setCalEvents,
  weekScheduleTemplates,
}) {
  const [modal, setModal] = useState(null);
  const [showTplPicker, setShowTplPicker] = useState(false);
  const gridRef = useRef(null);
  const dragRef = useRef(null);
  // Suppresses hour-cell tap after releasing an event (ghost-click guard)
  const suppressClickRef = useRef(0);
  // Tracks the pointer position for hour-cell taps
  const cellTapRef = useRef(null);
  const [drag, setDrag] = useState(null);
  const [nowT, setNowT] = useState(new Date());
  useEffect(() => {
    const iv = setInterval(() => setNowT(new Date()), 60000);
    return () => clearInterval(iv);
  }, []);

  const wStart = getMonday(date);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(wStart);
    d.setDate(wStart.getDate() + i);
    return d;
  });
  const HOURS = Array.from(
    { length: CAL_END_H - CAL_START_H },
    (_, i) => CAL_START_H + i,
  );
  const gridH = (CAL_END_H - CAL_START_H) * CAL_HOUR_H;

  const eventsForDay = (d) => eventsOnDate(calEvents, d);

  const timeToY = (time) => {
    const [h, m] = time.split(":").map(Number);
    // Events before CAL_START_H clamp to the top of the grid (y=0).
    return Math.max(0, (h - CAL_START_H + m / 60) * CAL_HOUR_H);
  };
  const blockH = (start, end) => {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    let mins = eh * 60 + em - (sh * 60 + sm);
    if (mins <= 0) mins += 1440; // midnight-end (00:00) or any end < start
    return Math.max(28, (mins / 60) * CAL_HOUR_H);
  };

  const addEvent = (ev) => {
    setCalEvents((prev) => [...prev, { ...ev, id: uid() }]);
    setModal(null);
  };
  const updateEvent = (ev) => {
    setCalEvents((prev) => prev.map((e) => (e.id === ev.id ? ev : e)));
    setModal(null);
  };
  const deleteEvent = (id, opts) => {
    if (opts && opts.skipDate) {
      setCalEvents((prev) =>
        prev.map((e) =>
          e.id === id
            ? { ...e, exDates: [...(e.exDates || []), opts.skipDate] }
            : e,
        ),
      );
    } else {
      setCalEvents((prev) => prev.filter((e) => e.id !== id));
    }
    setModal(null);
  };

  // Long-press (180 ms) activates drag so quick swipes still scroll the page.
  // touchAction:"pan-y" on the event block lets the browser handle vertical
  // scrolls; setPointerCapture in the timer overrides that only when dragging.
  const evDown = (e, ev) => {
    if (e.button != null && e.button !== 0) return;
    // Date.now() draait hier in een pointer-handler, niet tijdens render.
    // eslint-disable-next-line react-hooks/purity
    suppressClickRef.current = Date.now() + 400;
    const el = e.currentTarget;
    const pid = e.pointerId;
    const timer = setTimeout(() => {
      if (dragRef.current && dragRef.current.id === ev.id) {
        dragRef.current.dragging = true;
        try {
          el.setPointerCapture(pid);
        } catch {}
      }
    }, 180);
    dragRef.current = {
      id: ev.id,
      ev,
      startX: e.clientX,
      startY: e.clientY,
      dx: 0,
      dy: 0,
      moved: false,
      dragging: false,
      timer,
    };
  };
  const evMove = (e) => {
    const s = dragRef.current;
    if (!s || !s.dragging) return;
    const dx = e.clientX - s.startX,
      dy = e.clientY - s.startY;
    s.moved = true;
    s.dx = dx;
    s.dy = dy;
    setDrag({ id: s.id, dx, dy });
  };
  const evUp = (e, ev) => {
    const s = dragRef.current;
    dragRef.current = null;
    if (!s) return;
    clearTimeout(s.timer);
    e.preventDefault(); // prevent synthetic click firing on underlying cell
    if (!s.moved || !s.dragging) {
      setDrag(null);
      setModal({ mode: "edit", event: ev });
      return;
    }
    let newDate = ev.date;
    const grid = gridRef.current;
    if (grid) {
      const rect = grid.getBoundingClientRect();
      const colW = rect.width / 7;
      let di = Math.floor((e.clientX - rect.left) / colW);
      di = Math.max(0, Math.min(6, di));
      newDate = dk(weekDays[di]);
    }
    let dur = tMin(ev.endTime) - tMin(ev.startTime);
    if (dur <= 0) dur += 1440;
    const deltaMin = Math.round(((s.dy / CAL_HOUR_H) * 60) / 15) * 15;
    let ns = tMin(ev.startTime) + deltaMin;
    ns = Math.max(CAL_START_H * 60, Math.min(CAL_END_H * 60 - 15, ns));
    let ne = Math.min(CAL_END_H * 60, ns + dur);
    setDrag(null);
    if (ev.repeat && ev.repeat !== "none") {
      const whole = confirm(
        `"${ev.title}" is een herhalend event.\n\nOK = hele reeks verplaatsen\nAnnuleren = alleen ${ev.date} verplaatsen`,
      );
      if (whole) {
        setCalEvents((prev) =>
          prev.map((x) =>
            x.id === ev.id
              ? { ...x, date: newDate, startTime: minT(ns), endTime: minT(ne) }
              : x,
          ),
        );
      } else {
        // Exclude this occurrence from the series; add a one-time copy at the new slot.
        setCalEvents((prev) => [
          ...prev.map((x) =>
            x.id === ev.id
              ? { ...x, exDates: [...(x.exDates || []), ev.date] }
              : x,
          ),
          {
            id: uid(),
            date: newDate,
            title: ev.title,
            icon: ev.icon,
            color: ev.color,
            desc: ev.desc || "",
            startTime: minT(ns),
            endTime: minT(ne),
            repeat: "none",
            exDates: [],
          },
        ]);
      }
    } else {
      setCalEvents((prev) =>
        prev.map((x) =>
          x.id === ev.id
            ? { ...x, date: newDate, startTime: minT(ns), endTime: minT(ne) }
            : x,
        ),
      );
    }
  };
  const evCancel = () => {
    const s = dragRef.current;
    if (s) clearTimeout(s.timer);
    dragRef.current = null;
    setDrag(null);
  };

  const we = new Date(wStart);
  we.setDate(wStart.getDate() + 6);
  const weekLabel = `${wStart.getDate()} ${MONTHS_NL[wStart.getMonth()].substring(0, 3)} – ${we.getDate()} ${MONTHS_NL[we.getMonth()].substring(0, 3)} ${we.getFullYear()}`;

  return (
    <div style={{ animation: "fadeUp .3s ease" }}>
      <div
        style={{
          padding: "8px 16px 4px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--text-muted)",
            letterSpacing: 0.3,
          }}
        >
          {weekLabel}
        </div>
        {weekScheduleTemplates && weekScheduleTemplates.length > 0 && (
          <button
            onClick={() => setShowTplPicker(!showTplPicker)}
            style={{
              fontSize: 10,
              fontWeight: 600,
              padding: "3px 9px",
              borderRadius: 6,
              background: showTplPicker ? "#dc2626" : "#7c3aed",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            {showTplPicker ? "✕ Sluiten" : "📅 Template laden"}
          </button>
        )}
      </div>
      {showTplPicker &&
        weekScheduleTemplates &&
        weekScheduleTemplates.length > 0 && (
          <div
            style={{
              margin: "0 12px 8px",
              background: "var(--purple-bg)",
              border: "1px solid var(--purple-border)",
              borderRadius: 10,
              padding: 10,
              animation: "fadeUp .2s ease",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--purple-text)",
                marginBottom: 7,
              }}
            >
              Kies een weekschema:
            </div>
            {weekScheduleTemplates.map((tpl) => (
              <div
                key={tpl.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 5,
                }}
              >
                <span
                  style={{
                    flex: 1,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--text)",
                  }}
                >
                  {tpl.name}
                </span>
                <span style={{ fontSize: 9, color: "var(--text-faint)" }}>
                  {tpl.events.length} ev.
                </span>
                <button
                  onClick={() => {
                    const newEvs = applyWeekTemplate(tpl, getMonday(date));
                    setCalEvents((prev) => [...prev, ...newEvs]);
                    setShowTplPicker(false);
                  }}
                  style={{
                    padding: "4px 8px",
                    borderRadius: 5,
                    background: "#7c3aed",
                    color: "white",
                    fontSize: 10,
                    fontWeight: 600,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  ➕
                </button>
                <button
                  onClick={() => {
                    if (
                      !confirm(
                        `"${tpl.name}" inladen en huidige week vervangen?`,
                      )
                    )
                      return;
                    const mon = getMonday(date);
                    const sun = new Date(mon);
                    sun.setDate(mon.getDate() + 6);
                    const monStr = dk(mon),
                      sunStr = dk(sun);
                    const newEvs = applyWeekTemplate(tpl, mon);
                    setCalEvents((prev) => [
                      ...prev.filter(
                        (e) =>
                          !(
                            e.date >= monStr &&
                            e.date <= sunStr &&
                            (!e.repeat || e.repeat === "none")
                          ),
                      ),
                      ...newEvs,
                    ]);
                    setShowTplPicker(false);
                  }}
                  style={{
                    padding: "4px 8px",
                    borderRadius: 5,
                    background: "var(--accent)",
                    color: "white",
                    fontSize: 10,
                    fontWeight: 600,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  🔄
                </button>
              </div>
            ))}
          </div>
        )}

      <div
        style={{
          overflowX: "auto",
          overflowY: "auto",
          maxHeight: "calc(100dvh - 140px)",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <div style={{ minWidth: 360 }}>
          <div
            style={{
              display: "flex",
              background: "var(--card)",
              borderBottom: "2px solid var(--border-mid)",
              position: "sticky",
              top: 0,
              zIndex: 10,
            }}
          >
            <div style={{ width: 42, flexShrink: 0 }} />
            {weekDays.map((d, i) => {
              const today = isToday(d);
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    padding: "6px 2px",
                    textAlign: "center",
                    borderLeft: "1px solid var(--border-soft)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: "var(--text-faint)",
                      lineHeight: 1,
                    }}
                  >
                    {WEEK_DAYS_SHORT[i]}
                  </div>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      margin: "3px auto 0",
                      background: today ? "var(--accent)" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: today ? "white" : "var(--text)",
                      }}
                    >
                      {d.getDate()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              position: "relative",
              height: gridH,
              background: "var(--card)",
            }}
          >
            {HOURS.map((h) => (
              <div
                key={h}
                style={{
                  position: "absolute",
                  top: (h - CAL_START_H) * CAL_HOUR_H,
                  left: 0,
                  width: 42,
                  height: CAL_HOUR_H,
                  paddingRight: 5,
                  paddingTop: 2,
                  fontSize: 9,
                  color: "#b0b7c3",
                  textAlign: "right",
                  borderTop: "1px solid var(--border-soft)",
                  userSelect: "none",
                }}
              >
                {String(h).padStart(2, "0")}:00
              </div>
            ))}

            <div
              ref={gridRef}
              style={{
                position: "absolute",
                left: 42,
                right: 0,
                top: 0,
                bottom: 0,
                display: "flex",
              }}
            >
              {weekDays.map((d, di) => (
                <div
                  key={di}
                  style={{
                    flex: 1,
                    position: "relative",
                    borderLeft: "1px solid var(--border-soft)",
                  }}
                >
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      className="cal-hour-cell"
                      onPointerDown={(e) => {
                        if (Date.now() < suppressClickRef.current) return;
                        cellTapRef.current = {
                          startX: e.clientX,
                          startY: e.clientY,
                          d,
                          h,
                        };
                      }}
                      onPointerUp={(e) => {
                        const t = cellTapRef.current;
                        cellTapRef.current = null;
                        if (!t || Date.now() < suppressClickRef.current) return;
                        if (
                          Math.hypot(
                            e.clientX - t.startX,
                            e.clientY - t.startY,
                          ) < 6
                        ) {
                          setModal({ mode: "add", date: t.d, hour: t.h });
                        }
                      }}
                      style={{
                        position: "absolute",
                        top: (h - CAL_START_H) * CAL_HOUR_H,
                        left: 0,
                        right: 0,
                        height: CAL_HOUR_H,
                        borderTop: "1px solid var(--border-soft)",
                        cursor: "pointer",
                        transition: "background .1s",
                      }}
                    />
                  ))}
                  {(() => {
                    const dayEvs = eventsForDay(d);
                    const layout = layoutOverlaps(dayEvs);
                    return dayEvs.map((ev) => {
                      const top = timeToY(ev.startTime);
                      const height = blockH(ev.startTime, ev.endTime);
                      const c = ev.color || "#059669";
                      const isDragging = drag && drag.id === ev.id;
                      const { col, totalCols } = layout.get(ev.id);
                      return (
                        <div
                          key={ev.id}
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            evDown(e, ev);
                          }}
                          onPointerMove={evMove}
                          onPointerUp={(e) => {
                            e.stopPropagation();
                            evUp(e, ev);
                          }}
                          onPointerCancel={evCancel}
                          style={{
                            position: "absolute",
                            top,
                            ...colStyle(col, totalCols),
                            height,
                            borderRadius: 5,
                            background: c + "30",
                            borderLeft: `3px solid ${c}`,
                            padding: "2px 4px",
                            overflow: "hidden",
                            cursor: "grab",
                            touchAction: "pan-y",
                            zIndex: isDragging ? 60 : 2,
                            opacity: isDragging ? 0.9 : 1,
                            transform: isDragging
                              ? `translate(${drag.dx}px,${drag.dy}px) scale(1.03)`
                              : "none",
                            boxShadow: isDragging
                              ? "0 8px 24px rgba(0,0,0,.25)"
                              : `0 1px 4px ${c}30`,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: "var(--text)",
                              lineHeight: 1.2,
                              display: "flex",
                              gap: 2,
                              alignItems: "center",
                            }}
                          >
                            <Emoji
                              char={ev.icon}
                              size={12}
                              style={{ flexShrink: 0 }}
                            />
                            <span
                              style={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {ev.title}
                            </span>
                            {ev._recur && (
                              <span
                                style={{
                                  flexShrink: 0,
                                  fontSize: 8,
                                  opacity: 0.7,
                                }}
                              >
                                🔁
                              </span>
                            )}
                          </div>
                          {height > 38 && (
                            <div
                              style={{
                                fontSize: 9,
                                color: "var(--text-muted)",
                                marginTop: 1,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {ev.startTime}–{ev.endTime}
                            </div>
                          )}
                          {height > 54 && ev.desc && (
                            <div
                              style={{
                                fontSize: 8,
                                color: "var(--text-muted)",
                                marginTop: 1,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {ev.desc}
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                  {isToday(d) && nowT.getHours() >= CAL_START_H && (
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: timeToY(
                          `${String(nowT.getHours()).padStart(2, "0")}:${String(nowT.getMinutes()).padStart(2, "0")}`,
                        ),
                        height: 0,
                        borderTop: "2px solid #ef4444",
                        zIndex: 5,
                        pointerEvents: "none",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          left: -3,
                          top: -4,
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          background: "#ef4444",
                          boxShadow: "0 0 0 2px var(--card)",
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {modal && (
        <EventModal
          modal={modal}
          templates={calTemplates}
          onSave={modal.mode === "add" ? addEvent : updateEvent}
          onDelete={deleteEvent}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
