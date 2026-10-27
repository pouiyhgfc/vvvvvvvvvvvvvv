import { PERIOD_LABELS } from "../../lib/constants.js";
import Card from "../../ui/Card.jsx";
import Icon from "../../ui/Icon.jsx";
import Ring from "../../ui/Ring.jsx";

// Overzicht van de dag: totaalring, voortgang per dagdeel en de streak.
export default function DaySummary({
  pctTotal,
  pDone,
  pPct,
  routines,
  streak,
}) {
  return (
    <Card style={{ flexDirection: "row", alignItems: "center", gap: 18 }}>
      <Ring value={pctTotal} size={84} stroke={8} />
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {Object.entries(PERIOD_LABELS).map(([k, label]) => (
          <div
            key={k}
            style={{ display: "flex", flexDirection: "column", gap: 4 }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "var(--fs-sm)",
              }}
            >
              <span>{label}</span>
              <span style={{ color: "var(--text-muted)" }}>
                {pDone(k)}/{routines[k].length}
              </span>
            </div>
            <div
              style={{ height: 6, borderRadius: 3, background: "var(--track)" }}
            >
              <div
                style={{
                  width: `${pPct(k)}%`,
                  height: 6,
                  borderRadius: 3,
                  background: "var(--accent)",
                  transition: "width .4s ease",
                }}
              />
            </div>
          </div>
        ))}
        {streak > 0 && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: "var(--fs-xs)",
              fontWeight: 600,
              color: "var(--accent-text)",
            }}
          >
            <Icon name="fire" size={14} />
            {streak} {streak === 1 ? "dag" : "dagen"} op rij
          </span>
        )}
      </div>
    </Card>
  );
}
