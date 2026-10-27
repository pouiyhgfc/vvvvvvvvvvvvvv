import { DAYS_NL, MONTHS_NL } from "../../lib/constants.js";
import { dk } from "../../lib/date.js";
import Icon from "../../ui/Icon.jsx";

function dayTitle(date) {
  const offset = (d) => {
    const x = new Date();
    x.setDate(x.getDate() + d);
    return dk(x);
  };
  const key = dk(date);
  if (key === offset(0)) return "Vandaag";
  if (key === offset(-1)) return "Gisteren";
  if (key === offset(1)) return "Morgen";
  return DAYS_NL[date.getDay()];
}

// Kop van Vandaag: datum + titel, met pijltjes naar de vorige/volgende dag.
// Op een andere dag brengt de titel je terug naar vandaag.
export default function TodayHeader({ date, onNav, onToday }) {
  const title = dayTitle(date);
  const isToday = title === "Vandaag";
  const dateLine = `${DAYS_NL[date.getDay()]} ${date.getDate()} ${MONTHS_NL[date.getMonth()].toLowerCase()}`;
  return (
    <header
      style={{
        padding: "var(--sp-6) var(--sp-5) var(--sp-4)",
        display: "flex",
        alignItems: "flex-end",
        gap: "var(--sp-2)",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: "var(--fs-sm)",
            color: "var(--text-muted)",
          }}
        >
          {dateLine}
        </p>
        <h1
          style={{
            margin: 0,
            fontFamily: "var(--ff-head)",
            fontSize: "var(--fs-2xl)",
            fontWeight: 600,
            letterSpacing: "-0.01em",
            lineHeight: 1.2,
          }}
        >
          {title}
        </h1>
      </div>
      {!isToday && (
        <button type="button" onClick={onToday} style={pill}>
          Naar vandaag
        </button>
      )}
      <button
        type="button"
        aria-label="Vorige dag"
        onClick={() => onNav(-1)}
        style={round}
      >
        <Icon name="caret-left" size={20} />
      </button>
      <button
        type="button"
        aria-label="Volgende dag"
        onClick={() => onNav(1)}
        style={round}
      >
        <Icon name="caret-right" size={20} />
      </button>
    </header>
  );
}

const round = {
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

const pill = {
  height: 36,
  padding: "0 var(--sp-3)",
  marginBottom: 4,
  borderRadius: "var(--r-pill)",
  border: "none",
  background: "var(--accent-bg)",
  color: "var(--accent-text)",
  fontSize: "var(--fs-sm)",
  fontWeight: 600,
  whiteSpace: "nowrap",
};
