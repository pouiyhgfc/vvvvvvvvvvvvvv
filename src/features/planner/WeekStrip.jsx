import { MONTHS_NL } from "../../lib/constants.js";
import { dk, eventsOnDate, getMonday, isToday } from "../../lib/date.js";
import Card from "../../ui/Card.jsx";
import Icon from "../../ui/Icon.jsx";

const DAY_LETTERS = ["ma", "di", "wo", "do", "vr", "za", "zo"];

export function weekDays(date) {
  const mon = getMonday(date);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });
}

const short = (d) =>
  `${d.getDate()} ${MONTHS_NL[d.getMonth()].slice(0, 3).toLowerCase()}`;

// "26 okt – 1 nov" met pijltjes naar de vorige/volgende week.
export function WeekNav({ date, onShift }) {
  const days = weekDays(date);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <button
        type="button"
        aria-label="Vorige week"
        onClick={() => onShift(-7)}
        style={navBtn}
      >
        <Icon name="caret-left" size={20} />
      </button>
      <span
        style={{
          flex: 1,
          textAlign: "center",
          fontFamily: "var(--ff-head)",
          fontSize: "var(--fs-md)",
          fontWeight: 600,
        }}
      >
        {short(days[0])} – {short(days[6])}
      </span>
      <button
        type="button"
        aria-label="Volgende week"
        onClick={() => onShift(7)}
        style={navBtn}
      >
        <Icon name="caret-right" size={20} />
      </button>
    </div>
  );
}

// Weekstrip boven de dag-tijdlijn: kies een dag; een bolletje = iets gepland.
export default function WeekStrip({ date, onSelect, onShift, calEvents }) {
  const selected = dk(date);
  return (
    <Card
      style={{ gap: "var(--sp-2)", padding: "var(--sp-2) var(--sp-2) 10px" }}
    >
      <WeekNav date={date} onShift={onShift} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
        {weekDays(date).map((d, i) => {
          const key = dk(d);
          const on = key === selected;
          const today = isToday(d);
          const first = eventsOnDate(calEvents, d)[0];
          return (
            <button
              key={key}
              type="button"
              aria-pressed={on}
              aria-label={`${DAY_LETTERS[i]} ${d.getDate()}`}
              onClick={() => onSelect(d)}
              style={{
                border: "none",
                background: "transparent",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                padding: "2px 0",
                color: "var(--text)",
              }}
            >
              <span
                style={{
                  fontSize: "var(--fs-xs)",
                  fontWeight: today ? 600 : 400,
                  color: today ? "var(--accent-text)" : "var(--text-muted)",
                }}
              >
                {DAY_LETTERS[i]}
              </span>
              <span
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--ff-head)",
                  fontSize: "var(--fs-md)",
                  fontWeight: 600,
                  background: on ? "var(--accent)" : "transparent",
                  color: on ? "var(--accent-contrast)" : "var(--text)",
                }}
              >
                {d.getDate()}
              </span>
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 3,
                  background: first
                    ? first.color || "var(--accent)"
                    : "transparent",
                }}
              />
            </button>
          );
        })}
      </div>
    </Card>
  );
}

const navBtn = {
  width: 40,
  height: 40,
  borderRadius: "var(--r-pill)",
  border: "none",
  background: "transparent",
  color: "var(--text-muted)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
