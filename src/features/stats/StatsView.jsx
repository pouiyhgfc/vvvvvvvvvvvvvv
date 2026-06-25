import { dk } from "../../lib/date.js";
import { DAYS_NL, FALLBACK_AREA_STYLE } from "../../lib/constants.js";
import Emoji from "../../ui/Emoji.jsx";

export default function StatsView({ routines, allDays, areaStyles }) {
  const entries = Object.entries(allDays).filter(([, v]) => v?.checked);
  const total = Object.values(routines).flat().length;

  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const data = allDays[dk(d)];
    const done = data?.checked
      ? Object.values(data.checked).filter(Boolean).length
      : 0;
    last7.push({
      d: DAYS_NL[d.getDay()].substring(0, 2),
      pct: total > 0 ? Math.round((done / total) * 100) : 0,
    });
  }

  const allR = Object.values(routines).flat();
  const areaStats = {};
  allR.forEach((r) => {
    if (!areaStats[r.area]) areaStats[r.area] = { total: 0, done: 0 };
    areaStats[r.area].total += entries.length || 1;
    entries.forEach(([, data]) => {
      if (data.checked?.[r.id]) areaStats[r.area].done++;
    });
  });

  let bestPct = 0;
  entries.forEach(([, v]) => {
    const pct =
      total > 0
        ? Math.round(
            (Object.values(v.checked).filter(Boolean).length / total) * 100,
          )
        : 0;
    if (pct > bestPct) bestPct = pct;
  });

  const skipCount = {};
  allR.forEach((r) => {
    skipCount[r.id] = { name: r.name, icon: r.icon, skipped: 0 };
  });
  entries.forEach(([, data]) => {
    allR.forEach((r) => {
      if (!data.checked?.[r.id]) skipCount[r.id].skipped++;
    });
  });
  const mostSkipped = Object.values(skipCount)
    .sort((a, b) => b.skipped - a.skipped)
    .slice(0, 5);

  return (
    <div style={{ padding: "14px 12px 24px", animation: "fadeUp .3s ease" }}>
      <h2
        style={{
          fontFamily: "var(--ff-head)",
          fontSize: 18,
          fontWeight: 700,
          marginBottom: 14,
        }}
      >
        📊 Statistieken
      </h2>

      <div
        style={{
          background: "var(--card)",
          borderRadius: 12,
          padding: 12,
          marginBottom: 8,
          boxShadow: "0 1px 3px var(--shadow)",
        }}
      >
        <h3
          style={{
            fontFamily: "var(--ff-head)",
            fontSize: 13,
            fontWeight: 700,
            marginBottom: 12,
          }}
        >
          Afgelopen 7 dagen
        </h3>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-around",
            height: 100,
            gap: 4,
          }}
        >
          {last7.map((d, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                flex: 1,
              }}
            >
              <span
                style={{ fontSize: 9, fontWeight: 700, color: "var(--accent)" }}
              >
                {d.pct}%
              </span>
              <div
                style={{
                  width: "100%",
                  maxWidth: 26,
                  height: Math.max(3, (d.pct / 100) * 70),
                  background: "linear-gradient(to top,var(--accent),#34d399)",
                  borderRadius: 4,
                  transition: "height .5s ease",
                }}
              />
              <span style={{ fontSize: 9, color: "var(--text-muted)" }}>
                {d.d}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          background: "var(--card)",
          borderRadius: 12,
          padding: 12,
          marginBottom: 8,
          boxShadow: "0 1px 3px var(--shadow)",
        }}
      >
        <h3
          style={{
            fontFamily: "var(--ff-head)",
            fontSize: 13,
            fontWeight: 700,
            marginBottom: 10,
          }}
        >
          Per Focus Gebied
        </h3>
        {Object.entries(areaStats).map(([area, s]) => {
          const pct = s.total > 0 ? Math.round((s.done / s.total) * 100) : 0;
          const st = (areaStyles && areaStyles[area]) || FALLBACK_AREA_STYLE;
          return (
            <div key={area} style={{ marginBottom: 9 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 2,
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 600, color: st.text }}>
                  {area}
                </span>
                <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                  {pct}%
                </span>
              </div>
              <div
                style={{
                  height: 6,
                  borderRadius: 3,
                  background: "var(--border-soft)",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    borderRadius: 3,
                    width: `${pct}%`,
                    background: st.text,
                    transition: "width .5s ease",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {entries.length > 0 && (
        <div
          style={{
            background: "var(--card)",
            borderRadius: 12,
            padding: 12,
            marginBottom: 8,
            boxShadow: "0 1px 3px var(--shadow)",
          }}
        >
          <h3
            style={{
              fontFamily: "var(--ff-head)",
              fontSize: 13,
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            ⚠️ Meest overgeslagen
          </h3>
          {mostSkipped.map((r, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 0",
                borderBottom: i < 4 ? "1px solid var(--border-soft)" : "none",
              }}
            >
              <Emoji char={r.icon} size={15} />
              <span style={{ flex: 1, fontSize: 11, color: "var(--text)" }}>
                {r.name}
              </span>
              <span style={{ fontSize: 10, fontWeight: 600, color: "#dc2626" }}>
                {r.skipped}x
              </span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div
          style={{
            background: "var(--card)",
            borderRadius: 12,
            padding: 12,
            textAlign: "center",
            boxShadow: "0 1px 3px var(--shadow)",
          }}
        >
          <div style={{ marginBottom: 2 }}>
            <Emoji char="📅" size={24} />
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: "var(--accent)",
              fontFamily: "var(--ff-head)",
            }}
          >
            {entries.length}
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
            Dagen gelogd
          </div>
        </div>
        <div
          style={{
            background: "var(--card)",
            borderRadius: 12,
            padding: 12,
            textAlign: "center",
            boxShadow: "0 1px 3px var(--shadow)",
          }}
        >
          <div style={{ marginBottom: 2 }}>
            <Emoji char="🏆" size={24} />
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: "#d97706",
              fontFamily: "var(--ff-head)",
            }}
          >
            {bestPct}%
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
            Beste dag
          </div>
        </div>
      </div>

      {entries.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: 30,
            color: "var(--text-faint)",
          }}
        >
          <p style={{ fontSize: 32, marginBottom: 4 }}>📭</p>
          <p style={{ fontSize: 12 }}>Nog geen data — begin met afvinken!</p>
        </div>
      )}
    </div>
  );
}
