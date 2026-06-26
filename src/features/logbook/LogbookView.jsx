import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../lib/db.js";
import { uid } from "../../lib/date.js";
import {
  DAYS_NL,
  MONTHS_NL,
  MOODS,
  DEFAULT_NOTEBOOKS,
} from "../../lib/constants.js";
import { showToast } from "../../lib/toast.js";
import Emoji from "../../ui/Emoji.jsx";
import Button from "../../ui/Button.jsx";
import LogEntrySheet from "./LogEntrySheet.jsx";
import NotebookSheet from "./NotebookSheet.jsx";
import EntryPage from "./EntryPage.jsx";

function fmtDay(str) {
  const d = new Date(str + "T12:00:00");
  return `${DAYS_NL[d.getDay()]} ${d.getDate()} ${MONTHS_NL[d.getMonth()]}`;
}

// Vormen waarop je een entry op datum kunt vinden: ISO, "25 juni",
// "25 juni 2026" en de weekdag.
function dateSearchString(str) {
  const d = new Date(str + "T12:00:00");
  return [
    str,
    `${d.getDate()} ${MONTHS_NL[d.getMonth()]}`,
    `${d.getDate()} ${MONTHS_NL[d.getMonth()]} ${d.getFullYear()}`,
    DAYS_NL[d.getDay()],
  ]
    .join(" ")
    .toLowerCase();
}

const nbOf = (e) => e.notebookId || "logboek";

export default function LogbookView() {
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState(null);
  const [activeNb, setActiveNb] = useState("logboek");
  const [sheet, setSheet] = useState(null); // dag-notitie (plat tekstveld)
  const [nbSheet, setNbSheet] = useState(null); // "new" | notebook
  const [pageEntry, setPageEntry] = useState(null); // "new" | log-entry

  const settingsRec = useLiveQuery(() => db.settings.get("singleton"));
  const theme = settingsRec?.theme ?? "light";
  const notebooksBlob = useLiveQuery(() => db.blobs.get("notebooks"));
  const notebooks = notebooksBlob?.data ?? DEFAULT_NOTEBOOKS;
  const activeNotebook =
    notebooks.find((n) => n.id === activeNb) || notebooks[0];
  const activeId = activeNotebook?.id ?? "logboek";

  const logEntriesRaw = useLiveQuery(() =>
    db.logEntries.orderBy("date").reverse().toArray(),
  );
  const dayNotesRaw = useLiveQuery(() =>
    db.days.filter((d) => !!d.notes).toArray(),
  );

  const allEntries = useMemo(() => {
    if (!logEntriesRaw || !dayNotesRaw) return [];
    const log = logEntriesRaw
      .filter((e) => nbOf(e) === activeId)
      .map((e) => ({ ...e, _type: "log" }));
    const days =
      activeId === "logboek"
        ? dayNotesRaw.map((d) => ({
            id: `day_${d.date}`,
            date: d.date,
            body: d.notes,
            tags: [],
            mood: d.mood || null,
            _type: "day",
          }))
        : [];
    return [...log, ...days].sort((a, b) => b.date.localeCompare(a.date));
  }, [logEntriesRaw, dayNotesRaw, activeId]);

  const allTags = useMemo(() => {
    if (!logEntriesRaw) return [];
    const s = new Set();
    logEntriesRaw
      .filter((e) => nbOf(e) === activeId)
      .forEach((e) => e.tags?.forEach((t) => s.add(t)));
    return [...s].sort();
  }, [logEntriesRaw, activeId]);

  const filtered = useMemo(() => {
    let list = allEntries;
    if (activeTag) list = list.filter((e) => e.tags?.includes(activeTag));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.body?.toLowerCase().includes(q) ||
          e.tags?.some((t) => t.toLowerCase().includes(q)) ||
          dateSearchString(e.date).includes(q),
      );
    }
    return list;
  }, [allEntries, search, activeTag]);

  // Dag-notities (uit de tracker) blijven een plat tekstveld; log-entries
  // openen de volledige pagina met de rijke editor (zie EntryPage).
  const saveDayNote = async (data) => {
    await db.days.update(sheet.date, { notes: data.body });
    setSheet(null);
  };
  const deleteDayNote = async () => {
    await db.days.update(sheet.date, { notes: "" });
    setSheet(null);
    showToast("✓ Verwijderd");
  };

  const saveNotebook = (data) => {
    if (nbSheet === "new") {
      const id = uid();
      db.blobs.put({ key: "notebooks", data: [...notebooks, { id, ...data }] });
      setActiveNb(id);
    } else {
      db.blobs.put({
        key: "notebooks",
        data: notebooks.map((n) =>
          n.id === nbSheet.id ? { ...n, ...data } : n,
        ),
      });
    }
    setNbSheet(null);
  };

  const deleteNotebook = async () => {
    const id = nbSheet.id;
    const toMove = await db.logEntries.filter((e) => nbOf(e) === id).toArray();
    if (toMove.length)
      await db.logEntries.bulkPut(
        toMove.map((e) => ({ ...e, notebookId: "logboek" })),
      );
    await db.blobs.put({
      key: "notebooks",
      data: notebooks.filter((n) => n.id !== id),
    });
    setActiveNb("logboek");
    setNbSheet(null);
    showToast("✓ Notitieboek verwijderd");
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
      {/* Notitieboek-tabs */}
      <div
        style={{
          display: "flex",
          gap: 6,
          overflowX: "auto",
          paddingBottom: 8,
          marginBottom: 10,
          WebkitOverflowScrolling: "touch",
        }}
      >
        {notebooks.map((n) => {
          const active = n.id === activeId;
          return (
            <button
              key={n.id}
              onClick={() => (active ? setNbSheet(n) : setActiveNb(n.id))}
              style={{
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 12px",
                borderRadius: 99,
                fontSize: 12,
                fontWeight: 600,
                whiteSpace: "nowrap",
                border: active
                  ? `1.5px solid ${n.color}`
                  : "1px solid var(--border)",
                background: active ? "var(--sel-bg)" : "var(--card)",
                color: active ? "var(--text)" : "var(--text-muted)",
              }}
            >
              <Emoji char={n.icon} size={14} />
              {n.name}
            </button>
          );
        })}
        <button
          onClick={() => setNbSheet("new")}
          aria-label="Nieuw notitieboek"
          style={{
            flexShrink: 0,
            padding: "6px 12px",
            borderRadius: 99,
            fontSize: 14,
            fontWeight: 700,
            border: "1px dashed var(--border)",
            background: "var(--card)",
            color: "var(--text-muted)",
          }}
        >
          +
        </button>
      </div>

      {/* Kop: actief notitieboek + nieuwe entry */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
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
            gap: 7,
          }}
        >
          <Emoji char={activeNotebook?.icon ?? "📖"} size={20} />
          {activeNotebook?.name ?? "Logboek"}
        </h2>
        <Button size="sm" onClick={() => setPageEntry("new")}>
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
              : "Nog niets hier — druk op + Nieuw."}
          </p>
        </div>
      )}

      {/* Entry-kaarten */}
      {filtered.map((entry) => (
        <div
          key={entry.id}
          style={cardBase}
          onClick={() =>
            entry._type === "day" ? setSheet(entry) : setPageEntry(entry)
          }
        >
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
          {entry.title && (
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--text)",
                marginBottom: 3,
              }}
            >
              {entry.title}
            </div>
          )}
          {entry.body?.trim() && (
            <p
              style={{
                fontSize: 13,
                color: "var(--text-muted)",
                lineHeight: 1.55,
                whiteSpace: "pre-wrap",
                margin: 0,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
              }}
            >
              {entry.body}
            </p>
          )}
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

      {pageEntry && (
        <EntryPage
          entry={pageEntry === "new" ? null : pageEntry}
          notebookId={activeId}
          theme={theme}
          onClose={() => setPageEntry(null)}
        />
      )}
      {sheet && (
        <LogEntrySheet
          entry={sheet}
          onSave={saveDayNote}
          onDelete={deleteDayNote}
          onClose={() => setSheet(null)}
        />
      )}
      {nbSheet && (
        <NotebookSheet
          notebook={nbSheet === "new" ? null : nbSheet}
          onSave={saveNotebook}
          onDelete={
            nbSheet !== "new" && nbSheet.id !== "logboek"
              ? deleteNotebook
              : undefined
          }
          onClose={() => setNbSheet(null)}
        />
      )}
    </div>
  );
}
