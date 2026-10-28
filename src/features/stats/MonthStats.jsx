import { heatColor } from "../../lib/heat.js";

// Maand: kalender met per dag een kleur; tik op een dag = naar die dag.
export default function MonthStats({ monthData, setDate, setView }) {
  const today = new Date();
  return (
    <div
      style={{
        background: "var(--card)",
        borderRadius: "var(--r-lg)",
        padding: "14px 10px",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7,1fr)",
          gap: 3,
          marginBottom: 5,
        }}
      >
        {["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"].map((d) => (
          <div
            key={d}
            style={{
              textAlign: "center",
              fontSize: "var(--fs-xs)",
              fontWeight: 600,
              color: "var(--text-faint)",
              padding: 2,
            }}
          >
            {d}
          </div>
        ))}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7,1fr)",
          gap: 3,
        }}
      >
        {Array(monthData.fDow)
          .fill(null)
          .map((_, i) => (
            <div key={`e${i}`} />
          ))}
        {monthData.days.map((d) => {
          const isT =
            d.day === today.getDate() &&
            monthData.m === today.getMonth() &&
            monthData.y === today.getFullYear();
          return (
            <div
              key={d.day}
              onClick={() => {
                setDate(new Date(monthData.y, monthData.m, d.day));
                setView("tracker");
              }}
              style={{
                textAlign: "center",
                padding: "6px 2px",
                borderRadius: 7,
                background: heatColor(d.pct),
                cursor: "pointer",
                border: isT
                  ? "2px solid var(--accent)"
                  : "2px solid transparent",
                transition: "all .15s",
              }}
            >
              <div
                style={{
                  fontSize: "var(--fs-xs)",
                  fontWeight: isT ? 800 : 500,
                  color: d.pct >= 75 ? "white" : "var(--text)",
                }}
              >
                {d.day}
              </div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          display: "flex",
          gap: 6,
          marginTop: 14,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        {[
          [heatColor(0), "0%"],
          [heatColor(10), "<25%"],
          [heatColor(30), "<50%"],
          [heatColor(60), "<75%"],
          [heatColor(80), "75%+"],
        ].map(([c, l]) => (
          <div
            key={l}
            style={{ display: "flex", alignItems: "center", gap: 3 }}
          >
            <div
              style={{
                width: 9,
                height: 9,
                borderRadius: 2,
                background: c,
              }}
            />
            <span
              style={{
                fontSize: "var(--fs-xs)",
                color: "var(--text-muted)",
              }}
            >
              {l}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
