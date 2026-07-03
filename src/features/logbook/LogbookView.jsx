import { useState, useMemo, useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../lib/db.js";
import { uid } from "../../lib/date.js";
import {
  DAYS_NL,
  MONTHS_NL,
  MOODS,
  DEFAULT_NOTEBOOKS,
  EVENT_COLORS,
} from "../../lib/constants.js";
import { showToast } from "../../lib/toast.js";
import { useSortable, arrMove } from "../../hooks/useSortable.js";
import Emoji from "../../ui/Emoji.jsx";
import Button from "../../ui/Button.jsx";
import DragHandle from "../../ui/DragHandle.jsx";
import Sheet from "../../ui/Sheet.jsx";
import LogEntrySheet from "./LogEntrySheet.jsx";
import NotebookSheet from "./NotebookSheet.jsx";
import EntryPage from "./EntryPage.jsx";

function tagColor(tag) {
  let h = 0;
  for (let i = 0; i < tag.length; i++)
    h = (h * 31 + tag.charCodeAt(i)) & 0xffff;
  return EVENT_COLORS[h % EVENT_COLORS.length];
}

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

// Verwijdert recursief block-id's uit een sjabloon-doc (diepe kopie), zodat
// een nieuwe entry altijd verse id's krijgt en nooit block-id's deelt met
// het sjabloon of met eerder uit hetzelfde sjabloon gemaakte entries.
function stripBlockIds(blocks) {
  if (!Array.isArray(blocks)) return blocks;
  return blocks.map(({ id: _id, children, ...rest }) => ({
    ...rest,
    ...(children ? { children: stripBlockIds(children) } : {}),
  }));
}

// Lichte markdown-strip voor de kaart-preview: haalt kop-/lijst-/quote-tekens
// aan het begin van elke regel weg, geen volledige markdown-parser nodig.
function previewText(body) {
  if (!body) return "";
  return body
    .split("\n")
    .map((line) => line.replace(/^\s{0,3}(#{1,6}\s+|[-*]\s+|>\s+)/, ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function LogbookView() {
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState(null);
  // null → valt terug op het eerste notitieboek in de (sorteerbare) volgorde.
  const [activeNb, setActiveNb] = useState(null);
  const [sheet, setSheet] = useState(null); // dag-notitie (plat tekstveld)
  const [nbSheet, setNbSheet] = useState(null); // "new" | notebook
  const [pageEntry, setPageEntry] = useState(null); // "new" | { _draft } | log-entry
  const [sortNbSheet, setSortNbSheet] = useState(false);
  const [templatePicker, setTemplatePicker] = useState(false);
  const [confirmDeleteTpl, setConfirmDeleteTpl] = useState(null);

  const settingsRec = useLiveQuery(() => db.settings.get("singleton"));
  const theme = settingsRec?.theme ?? "light";
  const entryTemplatesBlob = useLiveQuery(() => db.blobs.get("entryTemplates"));
  const entryTemplates = entryTemplatesBlob?.data ?? [];
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
    // Log-entries: entries met order staan vast (asc); entries zonder order
    // krijgen negatief tijdstempel → sorteren vóór geordende entries (nieuwste eerst).
    const sortedLog = log.sort((a, b) => {
      const ao =
        a.order !== undefined
          ? a.order
          : -new Date(a.createdAt || a.date + "T00:00").getTime();
      const bo =
        b.order !== undefined
          ? b.order
          : -new Date(b.createdAt || b.date + "T00:00").getTime();
      return ao - bo;
    });
    const sortedDays = days.sort((a, b) => b.date.localeCompare(a.date));
    return [...sortedLog, ...sortedDays];
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
          e.title?.toLowerCase().includes(q) ||
          e.body?.toLowerCase().includes(q) ||
          e.tags?.some((t) => t.toLowerCase().includes(q)) ||
          dateSearchString(e.date).includes(q),
      );
    }
    return list;
  }, [allEntries, search, activeTag]);

  const canSort = !search.trim() && !activeTag;

  const onReorder = useCallback(
    async (from, to) => {
      const logOnly = filtered.filter((e) => e._type === "log");
      const moved = arrMove(logOnly, from, to);
      await db.logEntries.bulkPut(
        moved.map(({ _type: _t, ...rest }, i) => ({ ...rest, order: i })),
      );
    },
    [filtered],
  );

  const { ref: sortRef, onHandleDown } = useSortable(onReorder);

  const onNbReorder = useCallback(
    (from, to) => {
      db.blobs.put({ key: "notebooks", data: arrMove(notebooks, from, to) });
    },
    [notebooks],
  );
  const { ref: nbSortRef, onHandleDown: nbHandleDown } =
    useSortable(onNbReorder);

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
        {notebooks.length > 1 && (
          <button
            onClick={() => setSortNbSheet(true)}
            aria-label="Volgorde wijzigen"
            style={{
              flexShrink: 0,
              padding: "6px 10px",
              borderRadius: 99,
              fontSize: 13,
              border: "1px solid var(--border)",
              background: "var(--card)",
              color: "var(--text-faint)",
            }}
          >
            ↕
          </button>
        )}
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
        <Button
          size="sm"
          onClick={() =>
            entryTemplates.length
              ? setTemplatePicker(true)
              : setPageEntry("new")
          }
        >
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
          {allTags.map((tag) => {
            const c = tagColor(tag);
            const isActive = activeTag === tag;
            return (
              <button
                key={tag}
                onClick={() => setActiveTag(isActive ? null : tag)}
                style={{
                  padding: "3px 10px",
                  borderRadius: 99,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: isActive
                    ? `1.5px solid ${c}`
                    : "1px solid var(--border)",
                  background: isActive ? c + "22" : "var(--card)",
                  color: isActive ? c : "var(--text-muted)",
                }}
              >
                #{tag}
              </button>
            );
          })}
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
      <div ref={sortRef}>
        {(() => {
          let logIdx = 0;
          return filtered.map((entry) => {
            const isLog = entry._type === "log";
            const idx = isLog ? logIdx++ : -1;
            return (
              <div
                key={entry.id}
                data-srow={isLog && canSort ? "1" : undefined}
                style={{
                  ...cardBase,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 0,
                }}
                onClick={() => (isLog ? setPageEntry(entry) : setSheet(entry))}
              >
                {isLog && canSort && (
                  <div
                    style={{
                      alignSelf: "center",
                      marginRight: 2,
                      flexShrink: 0,
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DragHandle
                      onPointerDown={(e) => onHandleDown(e, idx, entry.id)}
                    />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
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
                      {fmtDay(
                        entry.updatedAt
                          ? entry.updatedAt.slice(0, 10)
                          : entry.date,
                      )}
                    </span>
                    {!isLog && (
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
                    {!isLog && entry.mood && (
                      <Emoji char={moodEmoji(entry.mood)} size={15} />
                    )}
                    <span style={{ flex: 1 }} />
                    <span style={{ fontSize: 15, color: "var(--text-faint)" }}>
                      ›
                    </span>
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
                  {previewText(entry.body) && (
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-muted)",
                        lineHeight: 1.4,
                        marginBottom: 3,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {previewText(entry.body)}
                    </div>
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
                      {entry.tags.map((tag) => {
                        const c = tagColor(tag);
                        return (
                          <span
                            key={tag}
                            style={{
                              fontSize: 10,
                              padding: "2px 8px",
                              borderRadius: 99,
                              background: c + "22",
                              color: c,
                              border: `1px solid ${c}44`,
                              fontWeight: 600,
                            }}
                          >
                            #{tag}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          });
        })()}
      </div>

      {pageEntry && (
        <EntryPage
          entry={pageEntry === "new" || pageEntry._draft ? null : pageEntry}
          notebookId={activeId}
          theme={theme}
          draft={pageEntry._draft}
          onClose={() => setPageEntry(null)}
        />
      )}
      {templatePicker && (
        <Sheet title="Nieuwe entry" onClose={() => setTemplatePicker(false)}>
          <div
            onClick={() => {
              setPageEntry("new");
              setTemplatePicker(false);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 4px",
              borderBottom: "1px solid var(--border-soft)",
              cursor: "pointer",
            }}
          >
            <Emoji char="📄" size={18} />
            <span
              style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}
            >
              Leeg document
            </span>
          </div>
          {entryTemplates.map((tpl) => (
            <div
              key={tpl.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 4px",
                borderBottom: "1px solid var(--border-soft)",
              }}
            >
              <div
                onClick={() => {
                  setPageEntry({ _draft: { doc: stripBlockIds(tpl.doc) } });
                  setTemplatePicker(false);
                }}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                  minWidth: 0,
                }}
              >
                <Emoji char={tpl.icon} size={18} />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text)",
                  }}
                >
                  {tpl.name}
                </span>
              </div>
              <button
                onClick={() => setConfirmDeleteTpl(tpl)}
                aria-label="Sjabloon verwijderen"
                style={{
                  color: "var(--text-faint)",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  padding: 4,
                }}
              >
                <Emoji char="🗑️" size={14} />
              </button>
            </div>
          ))}
        </Sheet>
      )}
      {confirmDeleteTpl && (
        <ConfirmDialog
          title="Sjabloon verwijderen?"
          message={`"${confirmDeleteTpl.name}" wordt verwijderd.`}
          onCancel={() => setConfirmDeleteTpl(null)}
          onConfirm={async () => {
            await db.blobs.put({
              key: "entryTemplates",
              data: entryTemplates.filter((t) => t.id !== confirmDeleteTpl.id),
            });
            setConfirmDeleteTpl(null);
          }}
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
      {sortNbSheet && (
        <Sheet
          title="Volgorde notitieboeken"
          onClose={() => setSortNbSheet(false)}
        >
          <div ref={nbSortRef}>
            {notebooks.map((n, i) => (
              <div
                key={n.id}
                data-srow="1"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "var(--card)",
                  border: `1.5px solid ${n.color}22`,
                  marginBottom: 6,
                  boxShadow: "0 1px 2px var(--shadow)",
                }}
              >
                <DragHandle onPointerDown={(e) => nbHandleDown(e, i, n.id)} />
                <Emoji char={n.icon} size={18} />
                <span
                  style={{
                    flex: 1,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text)",
                  }}
                >
                  {n.name}
                </span>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 99,
                    background: n.color,
                    flexShrink: 0,
                  }}
                />
              </div>
            ))}
          </div>
        </Sheet>
      )}
    </div>
  );
}
