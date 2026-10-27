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
          gap: 8,
        }}
      >
        {sorted.map((meta) => {
          const rec = hifdMap[meta.id];
          const pct = rec ? (rec.versesKnown / meta.verses) * 100 : 0;
          const bg = heatColor(pct);
          const isMemorized = rec?.status === "memorized";
          return (
            <button
              key={meta.id}
              onClick={() => onSelect(meta.id)}
              style={{
                background: bg,
                border: isMemorized
                  ? "2px solid var(--accent)"
                  : "1px solid var(--border-soft)",
                borderRadius: 10,
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
                  fontWeight: 700,
                  fontSize: 11,
                  color: pct >= 75 ? "#fff" : "var(--text)",
                }}
              >
                {meta.id}
              </div>
              <div
                style={{
                  fontSize: 9,
                  color:
                    pct >= 75 ? "rgba(255,255,255,.8)" : "var(--text-muted)",
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
