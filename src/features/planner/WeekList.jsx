import { dk, eventsOnDate, isToday } from "../../lib/date.js";
import Card from "../../ui/Card.jsx";
import { WeekNav, weekDays } from "./WeekStrip.jsx";

const DAY_LETTERS = ["ma", "di", "wo", "do", "vr", "za", "zo"];

// De week als lijst per dag: leesbaar op een telefoon, i.p.v. zeven smalle
// kolommen. Tik op een blok = bewerken, op de dag zelf = die dag openen.
export default function WeekList({
  date,
  onShift,
  calEvents,
  onOpenDay,
  onEdit,
}) {
  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}
    >
      <WeekNav date={date} onShift={onShift} />
      {weekDays(date).map((d, i) => {
        const events = eventsOnDate(calEvents, d).sort((a, b) =>
          a.startTime.localeCompare(b.startTime),
        );
        const today = isToday(d);
        return (
          <Card
            key={dk(d)}
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 14,
              padding: "12px 16px",
              outline: today ? "2px solid var(--accent)" : "none",
              outlineOffset: -2,
            }}
          >
            <button
              type="button"
              aria-label={`Open ${DAY_LETTERS[i]} ${d.getDate()}`}
              onClick={() => onOpenDay(d)}
              style={{
                width: 40,
                minHeight: 44,
                border: "none",
                background: "transparent",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                color: today ? "var(--accent-text)" : "var(--text)",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: "var(--fs-xs)",
                  color: today ? undefined : "var(--text-muted)",
                }}
              >
                {DAY_LETTERS[i]}
              </span>
              <span
                style={{
                  fontFamily: "var(--ff-head)",
                  fontSize: "var(--fs-xl)",
                  fontWeight: 600,
                }}
              >
                {d.getDate()}
              </span>
            </button>
            <div
              style={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {events.length === 0 && (
                <button
                  type="button"
                  onClick={() => onOpenDay(d)}
                  style={{
                    minHeight: 44,
                    border: "none",
                    background: "transparent",
                    textAlign: "left",
                    color: "var(--text-muted)",
                    fontSize: "var(--fs-sm)",
                    padding: 0,
                  }}
                >
                  Niets gepland
                </button>
              )}
              {events.map((ev) => (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => onEdit(ev)}
                  style={{
                    minHeight: 36,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    border: "none",
                    background: "transparent",
                    color: "var(--text)",
                    textAlign: "left",
                    padding: 0,
                  }}
                >
                  <span
                    style={{
                      width: 4,
                      height: 18,
                      borderRadius: 2,
                      background: ev.color || "var(--accent)",
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      width: 44,
                      fontSize: "var(--fs-sm)",
                      color: "var(--text-muted)",
                      flexShrink: 0,
                    }}
                  >
                    {ev.startTime}
                  </span>
                  <span
                    dir="auto"
                    style={{
                      flex: 1,
                      minWidth: 0,
                      fontSize: "var(--fs-md)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {ev.title}
                  </span>
                </button>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
