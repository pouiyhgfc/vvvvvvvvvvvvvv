import { dk } from "../../lib/date.js";
import { MONTHS_NL } from "../../lib/constants.js";
import { heatColor } from "../../lib/heat.js";
import Emoji from "../../ui/Emoji.jsx";

// Jaar: kerncijfers, jaarraster en per maand een balk.
export default function YearStats({ yearData }) {
  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 8,
          marginBottom: 10,
        }}
      >
        {[
          { icon: "📅", val: yearData.activeDays, label: "Actieve dagen" },
          {
            icon: "🔥",
            val: yearData.longestStreak,
            label: "Langste reeks",
          },
          {
            icon: "📊",
            val: `${yearData.avgPct}%`,
            label: "Gem. voltooiing",
          },
        ].map(({ icon, val, label }) => (
          <div
            key={label}
            style={{
              background: "var(--card)",
              borderRadius: 12,
              padding: "12px 8px",
              textAlign: "center",
            }}
          >
            <div style={{ marginBottom: 4 }}>
              <Emoji char={icon} size={20} />
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: "var(--accent)",
                fontFamily: "var(--ff-head)",
                lineHeight: 1,
                marginBottom: 3,
              }}
            >
              {val}
            </div>
            <div
              style={{
                fontSize: "var(--fs-xs)",
                color: "var(--text-muted)",
                lineHeight: 1.3,
              }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          background: "var(--card)",
          borderRadius: "var(--r-lg)",
          padding: "14px 12px",
          marginBottom: 10,
        }}
      >
        <div
          style={{
            fontFamily: "var(--ff-head)",
            fontSize: "var(--fs-sm)",
            fontWeight: 600,
            marginBottom: 10,
            color: "var(--text)",
          }}
        >
          Jaaroverzicht
        </div>
        {/* Het hele jaar in één keer zichtbaar: elke week een kolom die de
            breedte deelt, zonder zijwaarts scrollen. */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${yearData.weeks.length}, 1fr)`,
            gap: 2,
          }}
        >
          {yearData.weeks.map((week, wi) => (
            <div
              key={wi}
              style={{ display: "grid", gap: 2, alignContent: "start" }}
            >
              {week.map((day, di) => (
                <div
                  key={di}
                  title={day ? `${dk(day.date)}: ${day.pct}%` : ""}
                  style={{
                    aspectRatio: "1",
                    borderRadius: 1.5,
                    background: day ? heatColor(day.pct) : "transparent",
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          background: "var(--card)",
          borderRadius: "var(--r-lg)",
          padding: "14px 12px",
        }}
      >
        <div
          style={{
            fontFamily: "var(--ff-head)",
            fontSize: "var(--fs-sm)",
            fontWeight: 600,
            marginBottom: 12,
            color: "var(--text)",
          }}
        >
          Per maand
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-around",
            height: 80,
            gap: 3,
          }}
        >
          {yearData.monthBars.map(({ m, pct }) => (
            <div
              key={m}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                flex: 1,
              }}
            >
              <div
                style={{
                  width: "100%",
                  maxWidth: 22,
                  height: Math.max(2, (pct / 100) * 56),
                  background:
                    pct > 0
                      ? "linear-gradient(to top,var(--accent),#4db38f)"
                      : "var(--border-soft)",
                  borderRadius: 3,
                  transition: "height .5s ease",
                }}
              />
              <span
                style={{
                  fontSize: "var(--fs-xs)",
                  color: "var(--text-muted)",
                  fontWeight: 600,
                }}
              >
                {MONTHS_NL[m].substring(0, 3)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
