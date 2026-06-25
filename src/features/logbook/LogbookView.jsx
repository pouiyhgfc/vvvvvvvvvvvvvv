import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../lib/db.js";
import { uid, dk } from "../../lib/date.js";
import { DAYS_NL, MONTHS_NL, MOODS } from "../../lib/constants.js";
import { showToast } from "../../lib/toast.js";
import Emoji from "../../ui/Emoji.jsx";
import Button from "../../ui/Button.jsx";
import LogEntrySheet from "./LogEntrySheet.jsx";

function fmtDay(str) {
  const d = new Date(str + "T12:00:00");
  return `${DAYS_NL[d.getDay()]} ${d.getDate()} ${MONTHS_NL[d.getMonth()]}`;
}

export default function LogbookView() {
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState(null);
  const [sheet, setSheet] = useState(null); // "new" | entry

  const logEntriesRaw = useLiveQuery(() =>
    db.logEntries.orderBy("date").reverse().toArray(),
  );
  const dayNotesRaw = useLiveQuery(() =>
    db.days.filter((d) => !!d.notes).toArray(),
  );

  const allEntries = useMemo(() => {
    if (!logEntriesRaw || !dayNotesRaw) return [];
    const log = logEntriesRaw.map((e) => ({ ...e, _type: "log" }));
    const days = dayNotesRaw.map((d) => ({
      id: `day_${d.date}`,
      date: d.date,
      body: d.notes,
      tags: [],
      mood: d.mood || null,
      _type: "day",
    }));
    return [...log, ...days].sort((a, b) => b.date.localeCompare(a.date));
  }, [logEntriesRaw, dayNotesRaw]);

  const allTags = useMemo(() => {
    if (!logEntriesRaw) return [];
    const s = new Set();
    logEntriesRaw.forEach((e) => e.tags?.forEach((t) => s.add(t)));
    return [...s].sort();
  }, [logEntriesRaw]);

  const filtered = useMemo(() => {
    let list = allEntries;
    if (activeTag) list = list.filter((e) => e.tags?.includes(activeTag));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.body?.toLowerCase().includes(q) ||
          e.tags?.some((t) => t.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [allEntries, search, activeTag]);

  const saveEntry = async (data) => {
    if (sheet === "new") {
      await db.logEntries.put({
        id: uid(),
        date: dk(new Date()),
        body: data.body,
        tags: data.tags,
        mood: data.mood,
        createdAt: new Date().toISOString(),
      });
      showToast("✓ Entry toegevoegd");
    } else if (sheet._type === "log") {
      await db.logEntries.update(sheet.id, {
        body: data.body,
        tags: data.tags,
        mood: data.mood,
      });
    } else {
      await db.days.update(sheet.date, { notes: data.body });
    }
    setSheet(null);
  };

  const deleteEntry = async () => {
    if (sheet._type === "log") await db.logEntries.delete(sheet.id);
    else await db.days.update(sheet.date, { notes: "" });
    setSheet(null);
    showToast("✓ Verwijderd");
  };

  const moodEmoji = (val) => MOODS.find((m) => m.value === val)?.emoji;

  const cardBase = {
    background: "var(--card)",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    boxShadow: "0 1px 3px var(--shadow)",
    cursor: "pointer",
  };
  const inputStyle = {
    width: "100%",
    padding: "9px 12px",
    borderRadius: 9,
    border: "1.5px solid var(--border)",
    fontSize: 13,
    background: "var(--input-bg)",
    color: "var(--text)",
    outline: "none",
  };

  return (
    <div style={{ padding: "14px 12px 24px", animation: "fadeUp .3s ease" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 14,
        }}
      >
        <h2
          style={{
            fontFamily: "var(--ff-head)",
            fontSize: 18,
            fontWeight: 700,
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Emoji char="📖" size={20} /> Logboek
        </h2>
        <Button size="sm" onClick={() => setSheet("new")}>
          + Nieuw
        </Button>
      </div>

      {/* Zoekbalk */}
      <div style={{ position: "relative", marginBottom: 10 }}>
        <span
          style={{
            position: "absolute",
            left: 10,
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
            display: "flex",
          }}
        >
          <Emoji char="🔍" size={14} />
        </span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Zoek in tekst of tags..."
          style={{ ...inputStyle, paddingLeft: 32 }}
        />
      </div>

      {/* Tag-filter */}
      {allTags.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            marginBottom: 12,
          }}
        >
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              style={{
                padding: "3px 10px",
                borderRadius: 99,
                fontSize: 11,
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                background:
                  activeTag === tag ? "var(--accent)" : "var(--border-soft)",
                color: activeTag === tag ? "white" : "var(--text-muted)",
              }}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Leeg scherm */}
      {filtered.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: 40,
            color: "var(--text-faint)",
          }}
        >
          <div style={{ marginBottom: 6 }}>
            <Emoji char="📭" size={32} />
          </div>
          <p style={{ fontSize: 12 }}>
            {search || activeTag
              ? "Geen resultaten."
              : "Nog niets geschreven — druk op + Nieuw of schrijf een notitie in de tracker."}
          </p>
        </div>
      )}

      {/* Entry-kaarten */}
      {filtered.map((entry) => (
        <div key={entry.id} style={cardBase} onClick={() => setSheet(entry)}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexWrap: "wrap",
              marginBottom: 6,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--text-muted)",
              }}
            >
              {fmtDay(entry.date)}
            </span>
            {entry._type === "day" && (
              <span
                style={{
                  fontSize: 9,
                  padding: "1px 7px",
                  borderRadius: 99,
                  background: "var(--border-soft)",
                  color: "var(--text-faint)",
                  fontWeight: 600,
                }}
              >
                Dagnotitie
              </span>
            )}
            {entry.mood && <Emoji char={moodEmoji(entry.mood)} size={15} />}
            <span style={{ flex: 1 }} />
            <span style={{ fontSize: 15, color: "var(--text-faint)" }}>›</span>
          </div>
          <p
            style={{
              fontSize: 13,
              color: "var(--text)",
              lineHeight: 1.65,
              whiteSpace: "pre-wrap",
              margin: 0,
            }}
          >
            {entry.body}
          </p>
          {entry.tags?.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: 4,
                flexWrap: "wrap",
                marginTop: 8,
              }}
            >
              {entry.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: 10,
                    padding: "2px 8px",
                    borderRadius: 99,
                    background: "var(--border-soft)",
                    color: "var(--text-muted)",
                    fontWeight: 600,
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}

      {sheet && (
        <LogEntrySheet
          entry={sheet === "new" ? null : sheet}
          onSave={saveEntry}
          onDelete={sheet !== "new" ? deleteEntry : undefined}
          onClose={() => setSheet(null)}
        />
      )}
    </div>
  );
}
