import { FALLBACK_AREA_STYLE } from "../../lib/constants.js";
import Emoji from "../../ui/Emoji.jsx";
import Ring from "../../ui/Ring.jsx";

// Week: ring met het weektotaal, reeks, focusgebieden en de dagen.
export default function WeekStats({
  weekData,
  streak,
  areaWeekStats,
  areaStyles,
}) {
  return (
    <div>
      <div
        style={{
          background: "var(--card)",
          borderRadius: "var(--r-lg)",
          padding: 20,
          marginBottom: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Ring value={weekData.pct} size={112} stroke={10} />
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontFamily: "var(--ff-head)",
              fontSize: 22,
              fontWeight: 600,
              color: "var(--text)",
              lineHeight: 1,
            }}
          >
            {weekData.done} van {weekData.total}
          </div>
          <div
            style={{
              fontSize: "var(--fs-xs)",
              color: "var(--text-muted)",
              marginTop: 3,
            }}
          >
            afgevinkt deze week
          </div>
        </div>
        {streak > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "5px 12px",
              borderRadius: 99,
              background: "var(--accent-bg)",
              border: "1px solid var(--accent-border)",
            }}
          >
            <Emoji char="🔥" size={13} />
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--accent-text)",
              }}
            >
              {streak} {streak === 1 ? "dag" : "dagen"} op rij
            </span>
          </div>
        )}
      </div>

      {areaWeekStats.length > 0 && (
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
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 12,
              color: "var(--text)",
            }}
          >
            Per gebied
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
              overflowX: "auto",
              WebkitOverflowScrolling: "touch",
              paddingBottom: 4,
            }}
          >
            {areaWeekStats.map(({ area, pct }) => {
              const st =
                (areaStyles && areaStyles[area]) || FALLBACK_AREA_STYLE;
              return (
                <div
                  key={area}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    minWidth: 60,
                  }}
                >
                  <Ring value={pct} size={60} stroke={6} color={st.text} />
                  <div
                    style={{
                      fontSize: "var(--fs-xs)",
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      textAlign: "center",
                      maxWidth: 60,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {area}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 12,
            color: "var(--text)",
          }}
        >
          Dag voor dag
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-around",
            height: 90,
            gap: 4,
          }}
        >
          {weekData.days.map((d, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                flex: 1,
              }}
            >
              <span
                style={{
                  fontSize: "var(--fs-xs)",
                  fontWeight: 700,
                  color: d.pct > 0 ? "var(--accent)" : "transparent",
                }}
              >
                {d.pct}%
              </span>
              <div
                style={{
                  width: "100%",
                  maxWidth: 28,
                  height: Math.max(3, (d.pct / 100) * 64),
                  background:
                    d.pct > 0
                      ? "linear-gradient(to top,var(--accent),#4db38f)"
                      : "var(--border-soft)",
                  borderRadius: 4,
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
                {d.d}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
