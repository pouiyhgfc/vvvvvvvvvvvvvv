import { useState, useMemo, useCallback, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../lib/db.js";
import { uid } from "../../lib/date.js";
import { MOODS, DEFAULT_NOTEBOOKS } from "../../lib/constants.js";
import { showToast } from "../../lib/toast.js";
import { isActive, isArchived, isTrashed } from "../../lib/notes.js";
import { tagKey, tagStats } from "../../lib/tags.js";
import { useSortable, arrMove } from "../../hooks/useSortable.js";
import Emoji from "../../ui/Emoji.jsx";
import Icon from "../../ui/Icon.jsx";
import Button from "../../ui/Button.jsx";
import Sheet from "../../ui/Sheet.jsx";
import ConfirmDialog from "../../ui/ConfirmDialog.jsx";
import ArchiveSheet from "./ArchiveSheet.jsx";
import NoteCard from "./NoteCard.jsx";
import NotebookOrderSheet from "./NotebookOrderSheet.jsx";
import NotesMenuSheet from "./NotesMenuSheet.jsx";
import SelectionBar from "./SelectionBar.jsx";
import TemplatePickerSheet from "./TemplatePickerSheet.jsx";
import TrashSheet from "./TrashSheet.jsx";
import {
  dateSearchString,
  groupLabel,
  nbOf,
  stripBlockIds,
} from "./noteHelpers.js";
import LogEntrySheet from "./LogEntrySheet.jsx";
import NotebookSheet from "./NotebookSheet.jsx";
import EntryPage from "./EntryPage.jsx";

const squareBtn = {
  width: 44,
  height: 44,
  borderRadius: "var(--r-md)",
  border: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};
const chip = {
  flexShrink: 0,
  minHeight: 40,
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "0 14px",
  borderRadius: "var(--r-pill)",
  border: "none",
  fontSize: "var(--fs-sm)",
  fontWeight: 500,
  whiteSpace: "nowrap",
};
const sectionLabel = {
  fontSize: "var(--fs-xs)",
  fontWeight: 600,
  color: "var(--text-muted)",
  margin: "4px 4px 8px",
};

export default function LogbookView() {
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState(null);
  // null → valt terug op het eerste notitieboek in de (sorteerbare) volgorde.
  const [activeNb, setActiveNb] = useState(null);
  const [sheet, setSheet] = useState(null); // dag-notitie (plat tekstveld)
  const [nbSheet, setNbSheet] = useState(null); // "new" | notebook
  const [pageEntry, setPageEntry] = useState(null); // "new" | { _draft } | log-entry
  const [sortNbSheet, setSortNbSheet] = useState(false);
  const [menuSheet, setMenuSheet] = useState(false);
  const [templatePicker, setTemplatePicker] = useState(false);
  const [confirmDeleteTpl, setConfirmDeleteTpl] = useState(null);
  const [archiveSheet, setArchiveSheet] = useState(false);
  const [trashSheet, setTrashSheet] = useState(false);
  const [confirmPurge, setConfirmPurge] = useState(null); // entry | "all"
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [moveSheet, setMoveSheet] = useState(false);
  const [confirmBulkTrash, setConfirmBulkTrash] = useState(false);

  const settingsRec = useLiveQuery(() => db.settings.get("singleton"));
  const theme = settingsRec?.theme ?? "light";
  // "eigen" = handmatige sleepvolgorde, "datum" = gegroepeerd op datum
  // (nieuwste eerst); vastgezet blijft in beide modi bovenaan.
  const sortMode = settingsRec?.logbookSort ?? "eigen";
  const setSortMode = (mode) =>
    db.settings.update("singleton", { logbookSort: mode });
  const entryTemplatesBlob = useLiveQuery(() => db.blobs.get("entryTemplates"));
  const entryTemplates = entryTemplatesBlob?.data ?? [];
  const notebooksBlob = useLiveQuery(() => db.blobs.get("notebooks"));
  const notebooks = notebooksBlob?.data ?? DEFAULT_NOTEBOOKS;
  const activeNotebook =
    notebooks.find((n) => n.id === activeNb) || notebooks[0];
  const activeId = activeNotebook?.id ?? "logboek";

  // Selectie hoort bij één notitieboek — bij wisselen begint 'ie leeg,
  // anders blijven id's uit een ander boek "geselecteerd" maar onzichtbaar.
  const switchNotebook = (id) => {
    setActiveNb(id);
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const logEntriesRaw = useLiveQuery(() =>
    db.logEntries.orderBy("date").reverse().toArray(),
  );
  const dayNotesRaw = useLiveQuery(() =>
    db.days.filter((d) => !!d.notes).toArray(),
  );

  const allEntries = useMemo(() => {
    if (!logEntriesRaw || !dayNotesRaw) return [];
    const log = logEntriesRaw
      .filter((e) => nbOf(e) === activeId && isActive(e))
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
    // Log-entries: eerst vastgezette entries, daarna de rest. In "datum"-modus
    // sorteert de rest puur op updatedAt/date (nieuwste eerst), ongeacht `order`.
    // In "eigen"-modus staan entries met order vast (asc); entries zonder
    // order krijgen een negatief tijdstempel → sorteren vóór geordende
    // entries (nieuwste eerst).
    const sortedLog = log.sort((a, b) => {
      const pinDiff = (b.pinnedAt ? 1 : 0) - (a.pinnedAt ? 1 : 0);
      if (pinDiff) return pinDiff;
      if (sortMode === "datum") {
        const ad = a.updatedAt || a.date;
        const bd = b.updatedAt || b.date;
        return bd.localeCompare(ad);
      }
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
  }, [logEntriesRaw, dayNotesRaw, activeId, sortMode]);

  // Tags van dit notitieboek, hoofdletters samengevoegd, meest gebruikt eerst.
  const allTags = useMemo(
    () =>
      tagStats(
        (logEntriesRaw ?? []).filter(
          (e) => nbOf(e) === activeId && isActive(e),
        ),
      ),
    [logEntriesRaw, activeId],
  );

  // Archief/prullenbak: over alle notitieboeken heen, met het notitieboek als
  // label op de kaart (zie renderMetaEntry hieronder).
  const archivedEntries = useMemo(() => {
    if (!logEntriesRaw) return [];
    return logEntriesRaw
      .filter(isArchived)
      .sort((a, b) => (b.archivedAt || "").localeCompare(a.archivedAt || ""));
  }, [logEntriesRaw]);
  const trashedEntries = useMemo(() => {
    if (!logEntriesRaw) return [];
    return logEntriesRaw
      .filter(isTrashed)
      .sort((a, b) => (b.deletedAt || "").localeCompare(a.deletedAt || ""));
  }, [logEntriesRaw]);
  const notebookOf = (e) =>
    notebooks.find((n) => n.id === nbOf(e)) || notebooks[0];

  const filtered = useMemo(() => {
    let list = allEntries;
    if (activeTag)
      list = list.filter((e) => e.tags?.some((t) => tagKey(t) === activeTag));
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

  // Slepen kan ook tijdens zoeken/filteren (zie reorderWithinFull hieronder) —
  // alleen de sorteermodus en selectiemodus sluiten het nog uit.
  const canSort = sortMode === "eigen" && !selectMode;

  // Alleen log-entries zijn selecteerbaar (dagnotities hebben geen
  // logEntries-record, dus geen pin/archief/prullenbak/verplaatsen).
  const selectableIds = useMemo(
    () => filtered.filter((e) => e._type === "log").map((e) => e.id),
    [filtered],
  );
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const selectAllVisible = () => setSelectedIds(new Set(selectableIds));
  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  // Vastgezette entries vormen een eigen sleep-sectie (zie ONTWERP): ze staan
  // altijd boven de rest, en een sleep binnen de ene sectie mag de andere
  // niet aanraken. Twee aparte useSortable-containers i.p.v. één afdwingen
  // dat vanzelf — elke hook scant alleen data-srow-rijen in zijn eigen ref.
  const pinnedFiltered = useMemo(
    () => filtered.filter((e) => e._type === "log" && e.pinnedAt),
    [filtered],
  );
  const restFiltered = useMemo(
    () => filtered.filter((e) => !(e._type === "log" && e.pinnedAt)),
    [filtered],
  );
  // Ongefilterde tegenhangers: nodig om tijdens zoeken/filteren de volgorde
  // van onzichtbare entries intact te laten (zie reorderWithinFull).
  const pinnedAll = useMemo(
    () => allEntries.filter((e) => e._type === "log" && e.pinnedAt),
    [allEntries],
  );
  const restAll = useMemo(
    () => allEntries.filter((e) => !(e._type === "log" && e.pinnedAt)),
    [allEntries],
  );

  // Herordent de volledige lijst op basis van een sleep in een (mogelijk
  // gefilterde) deelverzameling: het gesleepte item komt in `fullList` naast
  // dezelfde buur als in de nieuwe volgorde van `filteredList`, zodat
  // onzichtbare (buiten het filter vallende) entries hun relatieve plek
  // t.o.v. hun zichtbare buren behouden.
  function reorderWithinFull(fullList, filteredList, from, to) {
    const draggedId = filteredList[from].id;
    const movedFiltered = arrMove(filteredList, from, to);
    const idx = movedFiltered.findIndex((e) => e.id === draggedId);
    const beforeId = idx > 0 ? movedFiltered[idx - 1].id : null;
    const afterId =
      idx < movedFiltered.length - 1 ? movedFiltered[idx + 1].id : null;

    const withoutDragged = fullList.filter((e) => e.id !== draggedId);
    let insertAt;
    if (beforeId) {
      insertAt = withoutDragged.findIndex((e) => e.id === beforeId) + 1;
    } else if (afterId) {
      insertAt = withoutDragged.findIndex((e) => e.id === afterId);
    } else {
      insertAt = 0;
    }
    const draggedItem = fullList.find((e) => e.id === draggedId);
    const result = [...withoutDragged];
    result.splice(insertAt, 0, draggedItem);
    return result;
  }

  const onReorderPinned = useCallback(
    async (from, to) => {
      const reordered = reorderWithinFull(pinnedAll, pinnedFiltered, from, to);
      await db.logEntries.bulkPut(
        reordered.map(({ _type: _t, ...rest }, i) => ({ ...rest, order: i })),
      );
    },
    [pinnedAll, pinnedFiltered],
  );
  const onReorderRest = useCallback(
    async (from, to) => {
      const filteredLog = restFiltered.filter((e) => e._type === "log");
      const allLog = restAll.filter((e) => e._type === "log");
      const reordered = reorderWithinFull(allLog, filteredLog, from, to);
      await db.logEntries.bulkPut(
        reordered.map(({ _type: _t, ...rest }, i) => ({ ...rest, order: i })),
      );
    },
    [restAll, restFiltered],
  );

  const { ref: pinnedSortRef, onHandleDown: onPinnedHandleDown } =
    useSortable(onReorderPinned);
  const { ref: restSortRef, onHandleDown: onRestHandleDown } =
    useSortable(onReorderRest);

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
      switchNotebook(id);
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
    switchNotebook("logboek");
    setNbSheet(null);
    showToast("✓ Notitieboek verwijderd");
  };

  const restoreFromArchive = async (id) => {
    await db.logEntries.update(id, { archivedAt: null });
    showToast("✓ Teruggezet");
  };
  const archiveToTrash = async (id) => {
    await db.logEntries.update(id, {
      archivedAt: null,
      deletedAt: new Date().toISOString(),
    });
    showToast("Naar prullenbak");
  };
  const restoreFromTrash = async (id) => {
    await db.logEntries.update(id, { deletedAt: null });
    showToast("✓ Hersteld");
  };
  const purgeEntry = async (id) => {
    await db.logEntries.delete(id);
    setConfirmPurge(null);
    showToast("✓ Definitief verwijderd");
  };
  const purgeAllTrash = async () => {
    await db.logEntries.bulkDelete(trashedEntries.map((e) => e.id));
    setConfirmPurge(null);
    showToast("✓ Prullenbak geleegd");
  };

  // Bulkacties op de huidige selectie. `logEntriesRaw` (niet `filtered`) is
  // de bron: die bevat de volledige records, `filtered` alleen de weergave.
  const selectedEntries = () =>
    (logEntriesRaw ?? []).filter((e) => selectedIds.has(e.id));

  const bulkPin = async () => {
    const selected = selectedEntries();
    const allPinned = selected.every((e) => e.pinnedAt);
    const now = new Date().toISOString();
    await db.logEntries.bulkPut(
      selected.map((e) => ({ ...e, pinnedAt: allPinned ? null : now })),
    );
    showToast(allPinned ? "Notities losgemaakt" : "Notities vastgezet");
    exitSelectMode();
  };
  const bulkArchive = async () => {
    const selected = selectedEntries();
    await db.logEntries.bulkPut(
      selected.map((e) => ({
        ...e,
        archivedAt: new Date().toISOString(),
        pinnedAt: null,
      })),
    );
    showToast(`${selected.length} gearchiveerd`);
    exitSelectMode();
  };
  const bulkTrash = async () => {
    const selected = selectedEntries();
    await db.logEntries.bulkPut(
      selected.map((e) => ({
        ...e,
        deletedAt: new Date().toISOString(),
        pinnedAt: null,
      })),
    );
    showToast(`${selected.length} naar prullenbak`);
    setConfirmBulkTrash(false);
    exitSelectMode();
  };
  // Verplaatste entries komen bovenaan het doelnotitieboek te staan; de
  // bestaande entries daar schuiven op (zelfde order-logica als elders).
  const bulkMove = async (targetNbId) => {
    const selected = selectedEntries();
    if (!selected.length) return;
    const targetExisting = (logEntriesRaw ?? []).filter(
      (e) => nbOf(e) === targetNbId && isActive(e) && !selectedIds.has(e.id),
    );
    const sortedTarget = [...targetExisting].sort((a, b) => {
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
    await db.logEntries.bulkPut([
      ...selected.map((e, i) => ({
        ...e,
        notebookId: targetNbId,
        order: i,
        pinnedAt: null,
      })),
      ...sortedTarget.map((e, i) => ({ ...e, order: selected.length + i })),
    ]);
    showToast(`✓ ${selected.length} verplaatst`);
    setMoveSheet(false);
    exitSelectMode();
  };

  const moodEmoji = (val) => MOODS.find((m) => m.value === val)?.emoji;

  // Long-press (450ms) op een kaart start de selectiemodus. Eén timer-ref
  // volstaat: er kan maar één kaart tegelijk worden ingedrukt.
  const longPressTimer = useRef(null);
  const longPressFired = useRef(false);
  const startLongPress = (id) => {
    longPressFired.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      setSelectMode(true);
      setSelectedIds(new Set([id]));
    }, 450);
  };
  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const renderCard = (entry, idx, handleDown) => {
    const isLog = entry._type === "log";
    return (
      <NoteCard
        key={entry.id}
        entry={entry}
        idx={idx}
        handleDown={handleDown}
        selectMode={selectMode}
        selected={isLog && selectedIds.has(entry.id)}
        canSort={canSort}
        moodEmoji={moodEmoji}
        onToggleSelect={() => toggleSelect(entry.id)}
        onLongPressStart={startLongPress}
        onLongPressEnd={cancelLongPress}
        onClick={() => {
          if (longPressFired.current) {
            longPressFired.current = false;
            return; // de long-press zelf telt niet ook nog als klik
          }
          if (selectMode) {
            if (isLog) toggleSelect(entry.id);
            return;
          }
          isLog ? setPageEntry(entry) : setSheet(entry);
        }}
      />
    );
  };

  const newNote = () =>
    entryTemplates.length ? setTemplatePicker(true) : setPageEntry("new");

  return (
    <div
      style={{
        padding: "var(--sp-6) var(--sp-4) var(--sp-6)",
        animation: "fadeUp .3s ease",
      }}
    >
      {/* Kop: titel + menu + nieuwe notitie, of de selectie-status */}
      {selectMode ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--sp-2)",
            minHeight: 48,
            marginBottom: "var(--sp-4)",
            padding: "0 var(--sp-1)",
          }}
        >
          <span
            style={{
              flex: 1,
              fontFamily: "var(--ff-head)",
              fontSize: "var(--fs-xl)",
              fontWeight: 600,
            }}
          >
            {selectedIds.size} geselecteerd
          </span>
          <Button variant="secondary" size="sm" onClick={selectAllVisible}>
            Alles
          </Button>
          <Button variant="secondary" size="sm" onClick={exitSelectMode}>
            Annuleren
          </Button>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--sp-2)",
            marginBottom: "var(--sp-4)",
            padding: "0 var(--sp-1)",
          }}
        >
          <h1
            style={{
              flex: 1,
              margin: 0,
              fontFamily: "var(--ff-head)",
              fontSize: "var(--fs-2xl)",
              fontWeight: 600,
              letterSpacing: "-0.01em",
            }}
          >
            Notities
          </h1>
          <button
            type="button"
            aria-label="Meer opties"
            onClick={() => setMenuSheet(true)}
            style={{
              ...squareBtn,
              background: "var(--card)",
              color: "var(--text)",
            }}
          >
            <Icon name="dots-three-vertical" size={22} />
          </button>
          <button
            type="button"
            aria-label="Nieuwe notitie"
            onClick={newNote}
            style={{
              ...squareBtn,
              background: "var(--accent)",
              color: "var(--accent-contrast)",
            }}
          >
            <Icon name="plus" size={24} />
          </button>
        </div>
      )}

      {/* Zoekbalk */}
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          height: 48,
          padding: "0 var(--sp-4)",
          borderRadius: "var(--r-md)",
          background: "var(--card)",
          marginBottom: "var(--sp-3)",
          color: "var(--text-muted)",
        }}
      >
        <Icon name="magnifying-glass" size={20} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Zoeken in notities en tags"
          style={{
            flex: 1,
            minWidth: 0,
            border: "none",
            outline: "none",
            background: "transparent",
            color: "var(--text)",
            fontSize: "var(--fs-md)",
          }}
        />
      </label>

      {/* Notitieboeken */}
      <div
        style={{
          display: "flex",
          gap: "var(--sp-2)",
          overflowX: "auto",
          marginBottom: "var(--sp-3)",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {notebooks.map((n) => {
          const active = n.id === activeId;
          return (
            <button
              key={n.id}
              type="button"
              aria-pressed={active}
              onClick={() => (active ? setNbSheet(n) : switchNotebook(n.id))}
              style={{
                ...chip,
                background: active ? "var(--text)" : "var(--card)",
                color: active ? "var(--bg)" : "var(--text)",
              }}
            >
              <Emoji char={n.icon} size={16} />
              {n.name}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setNbSheet("new")}
          aria-label="Nieuw notitieboek"
          style={{
            ...chip,
            background: "var(--card)",
            color: "var(--text-muted)",
          }}
        >
          <Icon name="plus" size={16} />
        </button>
      </div>

      {/* Tag-filter */}
      {allTags.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            marginBottom: "var(--sp-4)",
          }}
        >
          {allTags.map((tag) => {
            const on = activeTag === tag.key;
            return (
              <button
                key={tag.key}
                type="button"
                aria-pressed={on}
                onClick={() => setActiveTag(on ? null : tag.key)}
                style={{
                  minHeight: 32,
                  padding: "0 var(--sp-3)",
                  borderRadius: "var(--r-pill)",
                  border: "none",
                  fontSize: "var(--fs-sm)",
                  background: on ? "var(--accent-bg)" : "transparent",
                  color: on ? "var(--accent-text)" : "var(--text-muted)",
                  fontWeight: on ? 600 : 500,
                }}
              >
                #{tag.name}
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
            padding: "var(--sp-6) var(--sp-4)",
            color: "var(--text-muted)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "var(--sp-2)",
          }}
        >
          <Icon name="tray" size={32} />
          <p style={{ margin: 0, fontSize: "var(--fs-sm)" }}>
            {search || activeTag
              ? "Geen resultaten."
              : "Nog niets hier. Tik op + voor een nieuwe notitie."}
          </p>
        </div>
      )}

      {/* Entry-kaarten: vastgezet-sectie (eigen sleep-container) + de rest */}
      {pinnedFiltered.length > 0 && (
        <>
          <div style={sectionLabel}>Vastgezet</div>
          <div ref={pinnedSortRef} style={{ marginBottom: 6 }}>
            {pinnedFiltered.map((entry, i) =>
              renderCard(entry, i, onPinnedHandleDown),
            )}
          </div>
        </>
      )}
      {sortMode === "datum" ? (
        <div>
          {(() => {
            let lastLabel = null;
            return restFiltered.map((entry) => {
              const label = groupLabel(
                entry._type === "log" && entry.updatedAt
                  ? entry.updatedAt.slice(0, 10)
                  : entry.date,
              );
              const showHeader = label !== lastLabel;
              lastLabel = label;
              return (
                <div key={entry.id}>
                  {showHeader && (
                    <div style={{ ...sectionLabel, marginTop: 14 }}>
                      {label}
                    </div>
                  )}
                  {renderCard(entry, -1, onRestHandleDown)}
                </div>
              );
            });
          })()}
        </div>
      ) : (
        <div ref={restSortRef}>
          {(() => {
            let logIdx = 0;
            return restFiltered.map((entry) => {
              const isLog = entry._type === "log";
              const idx = isLog ? logIdx++ : -1;
              return renderCard(entry, idx, onRestHandleDown);
            });
          })()}
        </div>
      )}

      {menuSheet && (
        <NotesMenuSheet
          sortMode={sortMode}
          onSort={setSortMode}
          onSelect={selectableIds.length > 0 ? () => setSelectMode(true) : null}
          onEditNotebook={() => setNbSheet(activeNotebook)}
          onOrderNotebooks={
            notebooks.length > 1 ? () => setSortNbSheet(true) : null
          }
          onArchive={() => setArchiveSheet(true)}
          onTrash={() => setTrashSheet(true)}
          archiveCount={archivedEntries.length}
          trashCount={trashedEntries.length}
          onClose={() => setMenuSheet(false)}
        />
      )}
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
        <TemplatePickerSheet
          templates={entryTemplates}
          onPick={(tpl) => {
            setPageEntry(
              tpl ? { _draft: { doc: stripBlockIds(tpl.doc) } } : "new",
            );
            setTemplatePicker(false);
          }}
          onDelete={setConfirmDeleteTpl}
          onClose={() => setTemplatePicker(false)}
        />
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
        <NotebookOrderSheet
          notebooks={notebooks}
          onClose={() => setSortNbSheet(false)}
        />
      )}
      {archiveSheet && (
        <ArchiveSheet
          entries={archivedEntries}
          notebookOf={notebookOf}
          onOpen={(entry) => {
            setArchiveSheet(false);
            setPageEntry(entry);
          }}
          onRestore={restoreFromArchive}
          onTrash={archiveToTrash}
          onClose={() => setArchiveSheet(false)}
        />
      )}
      {trashSheet && (
        <TrashSheet
          entries={trashedEntries}
          notebookOf={notebookOf}
          onRestore={restoreFromTrash}
          onPurge={setConfirmPurge}
          onClose={() => setTrashSheet(false)}
        />
      )}
      {confirmPurge && (
        <ConfirmDialog
          title="Definitief verwijderen?"
          message={
            confirmPurge === "all"
              ? `${trashedEntries.length} item(s) worden definitief verwijderd. Dit kan niet ongedaan worden gemaakt.`
              : "Dit item wordt definitief verwijderd. Dit kan niet ongedaan worden gemaakt."
          }
          onCancel={() => setConfirmPurge(null)}
          onConfirm={() =>
            confirmPurge === "all"
              ? purgeAllTrash()
              : purgeEntry(confirmPurge.id)
          }
        />
      )}
      {moveSheet && (
        <Sheet title="Verplaatsen naar…" onClose={() => setMoveSheet(false)}>
          {notebooks
            .filter((n) => n.id !== activeId)
            .map((n) => (
              <div
                key={n.id}
                onClick={() => bulkMove(n.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 4px",
                  borderBottom: "1px solid var(--border-soft)",
                  cursor: "pointer",
                }}
              >
                <Emoji char={n.icon} size={18} />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text)",
                  }}
                >
                  {n.name}
                </span>
              </div>
            ))}
        </Sheet>
      )}
      {confirmBulkTrash && (
        <ConfirmDialog
          title="Naar prullenbak?"
          message={`${selectedIds.size} item(s) gaan naar de prullenbak en worden na 30 dagen definitief verwijderd.`}
          confirmLabel="Naar prullenbak"
          onCancel={() => setConfirmBulkTrash(false)}
          onConfirm={bulkTrash}
        />
      )}
      {selectMode && selectedIds.size > 0 && (
        <SelectionBar
          onPin={bulkPin}
          onArchive={bulkArchive}
          onMove={() => setMoveSheet(true)}
          onTrash={() => setConfirmBulkTrash(true)}
        />
      )}
    </div>
  );
}
