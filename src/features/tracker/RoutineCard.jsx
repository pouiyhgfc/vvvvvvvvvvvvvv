import { FALLBACK_AREA_STYLE, PERIOD_LABELS } from "../../lib/constants.js";
import Card from "../../ui/Card.jsx";
import Emoji from "../../ui/Emoji.jsx";
import Icon from "../../ui/Icon.jsx";

// Routines van één dagdeel, met bovenin de keuze tussen de dagdelen.
// Afgevinkte routines zakken grijs en doorgestreept naar onderen.
export default function RoutineCard({
  routines,
  tab,
  setTab,
  checked,
  pDone,
  pop,
  toggle,
  areaStyles,
}) {
  const list = routines[tab];
  const sorted = [
    ...list.filter((r) => !checked[r.id]),
    ...list.filter((r) => checked[r.id]),
  ];
  return (
    <Card style={{ gap: "var(--sp-2)", paddingTop: 12, paddingBottom: 8 }}>
      <div
        role="tablist"
        aria-label="Dagdeel"
        style={{
          display: "flex",
          background: "var(--sunken)",
          borderRadius: "var(--r-md)",
          padding: 4,
          gap: 4,
        }}
      >
        {Object.entries(PERIOD_LABELS).map(([k, label]) => {
          const active = tab === k;
          return (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(k)}
              style={{
                flex: 1,
                minHeight: 44,
                borderRadius: "var(--r-sm)",
                border: "none",
                background: active ? "var(--card)" : "transparent",
                boxShadow: active ? "0 1px 3px var(--shadow)" : "none",
                color: active ? "var(--text)" : "var(--text-muted)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
              }}
            >
              <span style={{ fontSize: "var(--fs-sm)", fontWeight: 600 }}>
                {label}
              </span>
              <span style={{ fontSize: "var(--fs-xs)" }}>
                {pDone(k)}/{routines[k].length}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {sorted.map((r) => (
          <RoutineRow
            key={r.id}
            routine={r}
            done={!!checked[r.id]}
            popping={pop === r.id}
            onToggle={() => toggle(r.id)}
            area={areaStyles[r.area] || FALLBACK_AREA_STYLE}
          />
        ))}
        {list.length === 0 && (
          <p
            style={{
              margin: 0,
              padding: "var(--sp-4) 0",
              fontSize: "var(--fs-sm)",
              color: "var(--text-muted)",
            }}
          >
            Geen routines in dit dagdeel. Voeg ze toe onder Meer → Routines
            beheren.
          </p>
        )}
      </div>
    </Card>
  );
}

function RoutineRow({ routine, done, popping, onToggle, area }) {
  return (
    <button
      type="button"
      className="routine-item"
      aria-pressed={done}
      onClick={onToggle}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        minHeight: 48,
        padding: "6px 0",
        border: "none",
        background: "transparent",
        textAlign: "left",
        color: "var(--text)",
        width: "100%",
      }}
    >
      <span
        style={{
          width: 24,
          height: 24,
          borderRadius: 8,
          boxSizing: "border-box",
          border: done ? "none" : "1.5px solid var(--control-border)",
          background: done ? "var(--accent)" : "transparent",
          color: "var(--accent-contrast)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          animation: popping ? "pop .35s ease" : "none",
        }}
      >
        {done && <Icon name="check" size={16} />}
      </span>
      <span
        style={{
          display: "flex",
          color: done ? "var(--text-faint)" : "var(--text-muted)",
        }}
      >
        <Emoji char={routine.icon} size={22} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          dir="auto"
          style={{
            display: "block",
            fontSize: "var(--fs-md)",
            color: done ? "var(--text-muted)" : "var(--text)",
            textDecoration: done ? "line-through" : "none",
            textDecorationColor: "var(--control-border)",
          }}
        >
          {routine.name}
        </span>
        {routine.desc && (
          <span
            dir="auto"
            style={{
              display: "block",
              fontSize: "var(--fs-xs)",
              color: "var(--text-muted)",
              marginTop: 2,
            }}
          >
            {routine.desc}
          </span>
        )}
      </span>
      {routine.area && (
        <span
          title={routine.area}
          aria-label={routine.area}
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            background: area.border,
            flexShrink: 0,
          }}
        />
      )}
    </button>
  );
}
