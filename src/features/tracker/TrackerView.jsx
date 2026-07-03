import { useState, lazy, Suspense } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  PERIOD_LABELS,
  PERIOD_COLORS,
  MOODS,
  FALLBACK_AREA_STYLE,
} from "../../lib/constants.js";
import { db } from "../../lib/db.js";
import Ring from "../../ui/Ring.jsx";
import Emoji from "../../ui/Emoji.jsx";

const EntryPage = lazy(() => import("../logbook/EntryPage.jsx"));

export default function TrackerView({
  day,
  saveDay,
  routines,
  tab,
  setTab,
  checked,
  pctTotal,
  pDone,
  pPct,
  pop,
  toggle,
  areaStyles,
  streak,
  dateKey,
}) {
  const settingsRec = useLiveQuery(() => db.settings.get("singleton"));
  const theme = settingsRec?.theme ?? "light";
  const todayEntry = useLiveQuery(
    () =>
      db.logEntries
        .where("date")
        .equals(dateKey)
        .filter((e) => (e.notebookId || "logboek") === "logboek")
        .first(),
    [dateKey],
  );
  const [entryPage, setEntryPage] = useState(null);

  return (
    <div style={{ animation: "fadeUp .3s ease" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "16px 12px",
          background: "var(--card)",
          margin: "10px 12px",
          borderRadius: 14,
          boxShadow: "0 1px 4px var(--shadow)",
          flexWrap: "wrap",
        }}
      >
        <Ring value={pctTotal} size={84} label="Totaal" />
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 6,
            minWidth: 150,
          }}
        >
          {Object.entries(PERIOD_LABELS).map(([k, label]) => (
            <div
              key={k}
              style={{ display: "flex", alignItems: "center", gap: 5 }}
            >
              <span
                style={{ fontSize: 11, minWidth: 78, color: "var(--text)" }}
              >
                {label}
              </span>
              <div
                style={{
                  flex: 1,
                  height: 5,
                  borderRadius: 3,
                  background: "var(--border-soft)",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    borderRadius: 3,
                    width: `${pPct(k)}%`,
                    background: PERIOD_COLORS[k],
                    transition: "width .4s ease",
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  minWidth: 26,
                  textAlign: "right",
                  color: "var(--text-muted)",
                }}
              >
                {pDone(k)}/{routines[k].length}
              </span>
            </div>
          ))}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              marginTop: 3,
              alignSelf: "flex-start",
              padding: "5px 10px 5px 8px",
              borderRadius: 999,
              background: "var(--accent-bg)",
              border: "1px solid var(--accent-border)",
            }}
          >
            <Emoji char="🔥" size={14} />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--accent-text)",
              }}
            >
              {streak} dag{streak !== 1 ? "en" : ""} streak
            </span>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 12px", marginBottom: 5 }}>
        <div
          className="period-tabs"
          style={{
            display: "flex",
            gap: 0,
            background: "var(--border-soft)",
            borderRadius: 13,
            padding: 3,
          }}
        >
          {Object.entries(PERIOD_LABELS).map(([k, label]) => {
            const active = tab === k;
            return (
              <button
                key={k}
                onClick={() => setTab(k)}
                style={{
                  flex: 1,
                  padding: "8px 4px",
                  borderRadius: 10,
                  border: "none",
                  background: active ? "var(--card)" : "transparent",
                  color: active ? "var(--text)" : "var(--text-muted)",
                  fontSize: 12,
                  fontWeight: 600,
                  transition: "all .2s",
                  boxShadow: active ? "0 1px 4px rgba(20,30,25,.07)" : "none",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                {label}
                <span style={{ fontSize: 10, fontWeight: 600, opacity: 0.7 }}>
                  {pDone(k)}/{routines[k].length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        style={{
          padding: "0 12px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          marginBottom: 12,
        }}
      >
        {routines[tab].map((r, i) => {
          const done = !!checked[r.id];
          const a = areaStyles[r.area] || FALLBACK_AREA_STYLE;
          return (
            <div
              key={r.id}
              className="routine-item"
              onClick={() => toggle(r.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                padding: "10px 11px",
                borderRadius: 11,
                borderLeft: `4px solid ${a.border}`,
                background: done ? "var(--sel-bg)" : "var(--card)",
                boxShadow: "0 1px 2px var(--shadow)",
                cursor: "pointer",
                transition: "all .15s",
                animation: `fadeUp .2s ease ${i * 0.025}s both`,
                opacity: done ? 0.8 : 1,
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  border: `2px solid ${done ? "var(--accent)" : "var(--border)"}`,
                  background: done ? "var(--accent)" : "var(--card)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "all .2s",
                  animation: pop === r.id ? "pop .35s ease" : "none",
                }}
              >
                {done && (
                  <span
                    style={{
                      color: "var(--accent-contrast)",
                      fontSize: 13,
                      lineHeight: 1,
                    }}
                  >
                    ✓
                  </span>
                )}
              </div>
              <Emoji char={r.icon} size={18} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: done ? "var(--text-faint)" : "var(--text)",
                    textDecoration: done ? "line-through" : "none",
                  }}
                >
                  {r.name}
                </div>
                {r.desc && (
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--text-muted)",
                      marginTop: 1,
                      opacity: done ? 0.7 : 1,
                    }}
                  >
                    {r.desc}
                  </div>
                )}
              </div>
              <span
                style={{
                  fontSize: 9,
                  padding: "2px 6px",
                  borderRadius: 99,
                  background: a.tag,
                  color: a.text,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                {r.area}
              </span>
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          padding: 12,
          background: "var(--card)",
          margin: "0 12px 8px",
          borderRadius: 12,
          boxShadow: "0 1px 3px var(--shadow)",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: 130 }}>
          <label
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--text)",
              display: "block",
              marginBottom: 5,
            }}
          >
            ⚡ Energie: {day.energy}/10
          </label>
          <input
            type="range"
            min={1}
            max={10}
            value={day.energy}
            onChange={(e) => {
              const v = +e.target.value;
              saveDay({ ...day, energy: v });
            }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 190 }}>
          <label
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--text)",
              display: "block",
              marginBottom: 5,
            }}
          >
            Hoe voel je je?
          </label>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {MOODS.map((m) => (
              <button
                key={m.value}
                onClick={() => saveDay({ ...day, mood: m.value })}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1,
                  padding: "4px 7px",
                  borderRadius: 7,
                  border:
                    day.mood === m.value
                      ? "2px solid var(--accent)"
                      : "1.5px solid var(--border)",
                  background:
                    day.mood === m.value ? "var(--sel-bg)" : "var(--card)",
                  transition: "all .15s",
                }}
              >
                <Emoji char={m.emoji} size={18} />
                <span
                  style={{
                    fontSize: 8,
                    fontWeight: 600,
                    color:
                      day.mood === m.value
                        ? "var(--accent)"
                        : "var(--text-faint)",
                  }}
                >
                  {m.value}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: "0 12px 16px" }}>
        <button
          onClick={() => setEntryPage(todayEntry || "new")}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 12,
            border: "1.5px solid var(--border)",
            background: "var(--card)",
            color: "var(--text)",
            fontSize: 13,
            fontWeight: 600,
            textAlign: "left",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 1px 3px var(--shadow)",
          }}
        >
          <Emoji char={todayEntry ? "📖" : "📝"} size={18} />
          {todayEntry
            ? "Logboek voor vandaag openen"
            : "Nieuw logboek voor vandaag aanmaken"}
        </button>
      </div>

      {entryPage && (
        <Suspense fallback={null}>
          <EntryPage
            entry={entryPage === "new" ? null : entryPage}
            notebookId="logboek"
            date={dateKey}
            theme={theme}
            onClose={() => setEntryPage(null)}
          />
        </Suspense>
      )}
    </div>
  );
}
