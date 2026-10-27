import { SURAHS } from "../../lib/surahs.js";
import { heatColor } from "../../lib/heat.js";

export default function VoortgangView({ hifdMap, onSelect }) {
  const sorted = [...SURAHS].sort((a, b) => b.id - a.id);

  return (
    <div style={{ padding: "0 16px" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))",
          gap: 6,
        }}
      >
        {sorted.map((meta) => {
          const rec = hifdMap[meta.id];
          const pct = rec ? (rec.versesKnown / meta.verses) * 100 : 0;
          const bg = pct === 0 ? "var(--card)" : heatColor(pct);
          // Heatmap-kleuren zijn vast (licht → donkergroen): tekst erop ook.
          const fg = pct === 0 ? "var(--text)" : pct >= 75 ? "#fff" : "#17201b";
          const isMemorized = rec?.status === "memorized";
          return (
            <button
              key={meta.id}
              onClick={() => onSelect(meta.id)}
              style={{
                background: bg,
                border: "none",
                outline: isMemorized ? "2px solid var(--accent)" : "none",
                outlineOffset: -2,
                borderRadius: "var(--r-sm)",
                minHeight: 52,
                padding: "8px 4px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--ff-head)",
                  fontWeight: 600,
                  fontSize: "var(--fs-sm)",
                  color: fg,
                }}
              >
                {meta.id}
              </div>
              <div
                style={{
                  fontSize: "var(--fs-xs)",
                  color: pct === 0 ? "var(--text-muted)" : fg,
                  opacity: pct === 0 ? 1 : 0.8,
                  textAlign: "center",
                  lineHeight: 1.2,
                }}
              >
                {meta.tr.length > 10 ? meta.tr.slice(0, 9) + "…" : meta.tr}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
