import Icon from "../../ui/Icon.jsx";

const navBtn = {
  width: 44,
  height: 44,
  borderRadius: "var(--r-pill)",
  border: "none",
  background: "var(--card)",
  color: "var(--text)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const pillStyle = (active) => ({
  minHeight: 36,
  padding: "0 var(--sp-3)",
  borderRadius: "var(--r-sm)",
  fontSize: "var(--fs-sm)",
  fontWeight: 600,
  border: "none",
  background: active ? "var(--card)" : "transparent",
  color: active ? "var(--text)" : "var(--text-muted)",
});

// Kop van Statistieken: titel, Week/Maand/Jaar en vorige/volgende periode
// (tik op het label = terug naar nu).
export default function StatsHeader({
  statsPeriod,
  setStatsPeriod,
  periodLabel,
  periodSub,
  onNav,
  onToday,
}) {
  return (
    <>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--sp-2)",
          padding: "var(--sp-2) 4px var(--sp-3)",
          flexWrap: "wrap",
        }}
      >
        <h1
          style={{
            flex: 1,
            margin: 0,
            fontFamily: "var(--ff-head)",
            fontSize: "var(--fs-2xl)",
            fontWeight: 600,
            letterSpacing: "-0.01em",
          }}
        >
          Statistieken
        </h1>
        <div
          role="tablist"
          aria-label="Periode"
          style={{
            display: "flex",
            gap: 4,
            padding: 4,
            borderRadius: "var(--r-md)",
            background: "var(--track)",
          }}
        >
          {[
            ["week", "Week"],
            ["month", "Maand"],
            ["year", "Jaar"],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={statsPeriod === id}
              onClick={() => setStatsPeriod(id)}
              style={pillStyle(statsPeriod === id)}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* Periode kiezen: vorige/volgende; tik op het label = nu */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          marginBottom: "var(--sp-3)",
        }}
      >
        <button
          type="button"
          aria-label="Vorige periode"
          onClick={() => onNav(-1)}
          style={navBtn}
        >
          <Icon name="caret-left" size={20} />
        </button>
        <button
          type="button"
          onClick={onToday}
          style={{
            flex: 1,
            border: "none",
            background: "transparent",
            color: "var(--text)",
            minHeight: 44,
          }}
        >
          <span
            style={{
              display: "block",
              fontFamily: "var(--ff-head)",
              fontSize: "var(--fs-md)",
              fontWeight: 600,
            }}
          >
            {periodLabel}
          </span>
          {periodSub && (
            <span
              style={{
                display: "block",
                fontSize: "var(--fs-xs)",
                color: "var(--accent-text)",
              }}
            >
              {periodSub}
            </span>
          )}
        </button>
        <button
          type="button"
          aria-label="Volgende periode"
          onClick={() => onNav(1)}
          style={navBtn}
        >
          <Icon name="caret-right" size={20} />
        </button>
      </div>
    </>
  );
}
