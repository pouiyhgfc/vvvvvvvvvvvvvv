import { useMemo } from "react";
import { dk, getMonday } from "../../lib/date.js";
import {
  DAYS_NL,
  MONTHS_NL,
  FALLBACK_AREA_STYLE,
} from "../../lib/constants.js";
import Emoji from "../../ui/Emoji.jsx";
import Ring from "../../ui/Ring.jsx";

const HEAT = ["#f1efe9", "#d4ede5", "#8ecfb8", "#4db38f", "#0e7a52"];

function heatColor(pct) {
  if (pct === 0) return HEAT[0];
  if (pct < 25) return HEAT[1];
  if (pct < 50) return HEAT[2];
  if (pct < 75) return HEAT[3];
  return HEAT[4];
}

export default function StatsView({
  routines,
  allDays,
  areaStyles,
  date,
  setDate,
  setView,
  statsPeriod,
  setStatsPeriod,
}) {
  const total = Object.values(routines).flat().length;
  const allR = Object.values(routines).flat();

  const weekData = useMemo(() => {
    const mon = getMonday(date);
    const days = [];
    let weekDone = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(mon);
      d.setDate(mon.getDate() + i);
      const data = allDays[dk(d)];
      const done = data?.checked
        ? Object.values(data.checked).filter(Boolean).length
        : 0;
      days.push({
        d: DAYS_NL[d.getDay()].substring(0, 2),
        pct: total > 0 ? Math.round((done / total) * 100) : 0,
      });
      weekDone += done;
    }
    const weekTotal = total * 7;
    return {
      days,
      done: weekDone,
      total: weekTotal,
      pct: weekTotal > 0 ? Math.round((weekDone / weekTotal) * 100) : 0,
    };
  }, [date, allDays, total]);

  const areaWeekStats = useMemo(() => {
    const mon = getMonday(date);
    const stats = {};
    allR.forEach((r) => {
      if (!stats[r.area]) stats[r.area] = { total: 0, done: 0 };
    });
    for (let i = 0; i < 7; i++) {
      const d = new Date(mon);
      d.setDate(mon.getDate() + i);
      const data = allDays[dk(d)];
      allR.forEach((r) => {
        if (!stats[r.area]) return;
        stats[r.area].total++;
        if (data?.checked?.[r.id]) stats[r.area].done++;
      });
    }
    return Object.entries(stats).map(([area, s]) => ({
      area,
      pct: s.total > 0 ? Math.round((s.done / s.total) * 100) : 0,
    }));
  }, [date, allDays, allR]);

  const streak = useMemo(() => {
    const threshold = Math.max(1, Math.ceil(total * 0.5));
    let s = 0;
    const d = new Date();
    const todayData = allDays[dk(d)];
    const todayDone = todayData?.checked
      ? Object.values(todayData.checked).filter(Boolean).length
      : 0;
    if (todayDone >= threshold) s++;
    d.setDate(d.getDate() - 1);
    for (let i = 0; i < 365; i++) {
      const data = allDays[dk(d)];
      const done = data?.checked
        ? Object.values(data.checked).filter(Boolean).length
        : 0;
      if (done < threshold) break;
      s++;
      d.setDate(d.getDate() - 1);
    }
    return s;
  }, [allDays, total]);

  const monthData = useMemo(() => {
    const y = date.getFullYear(),
      m = date.getMonth();
    const first = new Date(y, m, 1),
      last = new Date(y, m + 1, 0);
    const fDow = first.getDay() === 0 ? 6 : first.getDay() - 1;
    const days = [];
    for (let d = 1; d <= last.getDate(); d++) {
      const k = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const data = allDays[k];
      const done = data?.checked
        ? Object.values(data.checked).filter(Boolean).length
        : 0;
      days.push({
        day: d,
        pct: total > 0 ? Math.round((done / total) * 100) : 0,
      });
    }
    return { y, m, fDow, days };
  }, [date, allDays, total]);

  const yearData = useMemo(() => {
    const y = date.getFullYear();
    const firstMon = getMonday(new Date(y, 0, 1));
    const weeks = [];
    const cur = new Date(firstMon);
    while (cur.getFullYear() <= y) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(cur);
        d.setDate(cur.getDate() + i);
        if (d.getFullYear() !== y) {
          week.push(null);
        } else {
          const data = allDays[dk(d)];
          const done = data?.checked
            ? Object.values(data.checked).filter(Boolean).length
            : 0;
          week.push({
            date: d,
            pct: total > 0 ? Math.round((done / total) * 100) : 0,
          });
        }
      }
      weeks.push(week);
      cur.setDate(cur.getDate() + 7);
      if (cur.getFullYear() > y) break;
    }

    let activeDays = 0,
      longestStreak = 0,
      totalPct = 0,
      trackedCount = 0,
      curS = 0;
    const threshold = Math.max(1, Math.ceil(total * 0.5));
    for (let m = 0; m < 12; m++) {
      for (let d = 1; d <= new Date(y, m + 1, 0).getDate(); d++) {
        const k = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const data = allDays[k];
        const done = data?.checked
          ? Object.values(data.checked).filter(Boolean).length
          : 0;
        if (done > 0) {
          activeDays++;
          totalPct += total > 0 ? Math.round((done / total) * 100) : 0;
          trackedCount++;
        }
        if (done >= threshold) {
          curS++;
          longestStreak = Math.max(longestStreak, curS);
        } else {
          curS = 0;
        }
      }
    }
    const avgPct = trackedCount > 0 ? Math.round(totalPct / trackedCount) : 0;

    const monthBars = [];
    for (let m = 0; m < 12; m++) {
      let mDone = 0;
      const daysInMonth = new Date(y, m + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const k = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const data = allDays[k];
        mDone += data?.checked
          ? Object.values(data.checked).filter(Boolean).length
          : 0;
      }
      const mTotal = total * daysInMonth;
      monthBars.push({
        m,
        pct: mTotal > 0 ? Math.round((mDone / mTotal) * 100) : 0,
      });
    }

    return { weeks, activeDays, longestStreak, avgPct, monthBars };
  }, [date, allDays, total]);

  const today = new Date();

  const pillStyle = (active) => ({
    flex: 1,
    padding: "7px 0",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    border: "none",
    cursor: "pointer",
    background: active ? "var(--card)" : "transparent",
    color: active ? "var(--text)" : "var(--text-muted)",
    boxShadow: active ? "0 1px 4px var(--shadow)" : "none",
    transition: "background .15s",
  });

  return (
    <div style={{ padding: "14px 12px 24px", animation: "fadeUp .3s ease" }}>
      {/* Segment switcher */}
      <div
        style={{
          display: "flex",
          background: "var(--border-soft)",
          borderRadius: 13,
          padding: 3,
          marginBottom: 14,
        }}
      >
        {[
          ["week", "Week"],
          ["month", "Maand"],
          ["year", "Jaar"],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setStatsPeriod(id)}
            style={pillStyle(statsPeriod === id)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── WEEK ─────────────────────────────────────────── */}
      {statsPeriod === "week" && (
        <div>
          <div
            style={{
              background: "var(--card)",
              borderRadius: 14,
              padding: 20,
              marginBottom: 10,
              boxShadow: "0 1px 3px var(--shadow)",
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
                  fontWeight: 800,
                  color: "var(--text)",
                  lineHeight: 1,
                }}
              >
                {weekData.done} van {weekData.total}
              </div>
              <div
                style={{
                  fontSize: 11,
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
                  {streak} dag streak
                </span>
              </div>
            )}
          </div>

          {areaWeekStats.length > 0 && (
            <div
              style={{
                background: "var(--card)",
                borderRadius: 14,
                padding: "14px 12px",
                marginBottom: 10,
                boxShadow: "0 1px 3px var(--shadow)",
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
                          fontSize: 9,
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
              borderRadius: 14,
              padding: "14px 12px",
              boxShadow: "0 1px 3px var(--shadow)",
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
                      fontSize: 9,
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
                      fontSize: 9,
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
      )}

      {/* ── MAAND ────────────────────────────────────────── */}
      {statsPeriod === "month" && (
        <div
          style={{
            background: "var(--card)",
            borderRadius: 14,
            padding: "14px 10px",
            boxShadow: "0 1px 3px var(--shadow)",
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
                  fontSize: 10,
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
                      fontSize: 11,
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
              [HEAT[0], "0%"],
              [HEAT[1], "<25%"],
              [HEAT[2], "<50%"],
              [HEAT[3], "<75%"],
              [HEAT[4], "75%+"],
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
                <span style={{ fontSize: 9, color: "var(--text-muted)" }}>
                  {l}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── JAAR ─────────────────────────────────────────── */}
      {statsPeriod === "year" && (
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
                label: "Langste streak",
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
                  boxShadow: "0 1px 3px var(--shadow)",
                }}
              >
                <div style={{ marginBottom: 4 }}>
                  <Emoji char={icon} size={20} />
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
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
                    fontSize: 9,
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
              borderRadius: 14,
              padding: "14px 10px",
              boxShadow: "0 1px 3px var(--shadow)",
              marginBottom: 10,
              overflowX: "auto",
              WebkitOverflowScrolling: "touch",
            }}
          >
            <div
              style={{
                fontFamily: "var(--ff-head)",
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 10,
                color: "var(--text)",
              }}
            >
              Jaar overzicht
            </div>
            <div style={{ display: "flex", gap: 2, minWidth: "max-content" }}>
              {yearData.weeks.map((week, wi) => (
                <div
                  key={wi}
                  style={{ display: "flex", flexDirection: "column", gap: 2 }}
                >
                  {week.map((day, di) => (
                    <div
                      key={di}
                      title={day ? `${dk(day.date)}: ${day.pct}%` : ""}
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 2,
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
              borderRadius: 14,
              padding: "14px 12px",
              boxShadow: "0 1px 3px var(--shadow)",
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
                      fontSize: 8,
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
      )}
    </div>
  );
}
