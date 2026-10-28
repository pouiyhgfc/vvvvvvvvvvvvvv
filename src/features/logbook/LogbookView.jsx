import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../lib/db.js";
import { uid } from "../../lib/date.js";
import { MOODS, DEFAULT_NOTEBOOKS } from "../../lib/constants.js";
import { showToast } from "../../lib/toast.js";
import { isActive, isArchived, isTrashed } from "../../lib/notes.js";
import { tagStats } from "../../lib/tags.js";
import Icon from "../../ui/Icon.jsx";
import ConfirmDialog from "../../ui/ConfirmDialog.jsx";
import ArchiveSheet from "./ArchiveSheet.jsx";
import NoteCard from "./NoteCard.jsx";
import NotebookOrderSheet from "./NotebookOrderSheet.jsx";
import NotesMenuSheet from "./NotesMenuSheet.jsx";
import SelectionBar from "./SelectionBar.jsx";
import TemplatePickerSheet from "./TemplatePickerSheet.jsx";
import TrashSheet from "./TrashSheet.jsx";
import { filterNotes, nbOf, stripBlockIds } from "./noteHelpers.js";
import LogEntrySheet from "./LogEntrySheet.jsx";
import MoveSheet from "./MoveSheet.jsx";
import NoteList from "./NoteList.jsx";
import { useLongPress } from "./useLongPress.js";
import { useNoteReorder } from "./useNoteReorder.js";
import NotebookTabs from "./NotebookTabs.jsx";
import NotesHeader from "./NotesHeader.jsx";
import TagFilter from "./TagFilter.jsx";
import {
  archiveEntries,
  deleteNotebook,
  moveEntries,
  pinEntries,
  trashEntries,
} from "./noteActions.js";
import { sortNotes } from "./noteOrder.js";
import NotebookSheet from "./NotebookSheet.jsx";
import EntryPage from "./EntryPage.jsx";

const ALL = "__alles";

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
  const [archiveSheet, setArchiveSheet] = useState(false);
  const [trashSheet, setTrashSheet] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [moveSheet, setMoveSheet] = useState(false);
  const [confirmBulkTrash, setConfirmBulkTrash] = useState(false);

  const settingsRec = useLiveQuery(() => db.settings.get("singleton"));
  const theme = settingsRec?.theme ?? "light";
  // "eigen" = handmatige sleepvolgorde, "datum" = gegroepeerd op datum
  // (nieuwste eerst); vastgezet blijft in beide modi bovenaan.
  const savedSort = settingsRec?.logbookSort ?? "eigen";
  const setSortMode = (mode) =>
    db.settings.update("singleton", { logbookSort: mode });
  const entryTemplatesBlob = useLiveQuery(() => db.blobs.get("entryTemplates"));
  const entryTemplates = entryTemplatesBlob?.data ?? [];
  const notebooksBlob = useLiveQuery(() => db.blobs.get("notebooks"));
  const notebooks = notebooksBlob?.data ?? DEFAULT_NOTEBOOKS;
  // "Alles" = alle notitieboeken samen, laatst bewerkt bovenaan.
  const isAll = activeNb === ALL;
  const activeNotebook = isAll
    ? null
    : notebooks.find((n) => n.id === activeNb) || notebooks[0];
  const activeId = isAll ? ALL : (activeNotebook?.id ?? "logboek");
  const sortMode = isAll ? "datum" : savedSort;

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
      .filter((e) => (isAll || nbOf(e) === activeId) && isActive(e))
      .map((e) => ({ ...e, _type: "log" }));
    const days =
      isAll || activeId === "logboek"
        ? dayNotesRaw.map((d) => ({
            id: `day_${d.date}`,
            date: d.date,
            body: d.notes,
            tags: [],
            mood: d.mood || null,
            _type: "day",
          }))
        : [];
    const sortedDays = days.sort((a, b) => b.date.localeCompare(a.date));
    return [...sortNotes(log, sortMode), ...sortedDays];
  }, [logEntriesRaw, dayNotesRaw, activeId, isAll, sortMode]);

  // Tags van dit notitieboek, hoofdletters samengevoegd, meest gebruikt eerst.
  const allTags = useMemo(
    () =>
      tagStats(
        (logEntriesRaw ?? []).filter(
          (e) => (isAll || nbOf(e) === activeId) && isActive(e),
        ),
      ),
    [logEntriesRaw, activeId, isAll],
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

  const filtered = useMemo(
    () => filterNotes(allEntries, { tag: activeTag, search }),
    [allEntries, search, activeTag],
  );

  // Slepen kan ook tijdens zoeken/filteren; alleen de sorteermodus,
  // selectiemodus en "Alles" sluiten het uit.
  const canSort = sortMode === "eigen" && !selectMode && !isAll;

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

  const reorder = useNoteReorder(allEntries, filtered);

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

  const removeNotebook = async () => {
    await deleteNotebook(nbSheet.id, notebooks);
    switchNotebook("logboek");
    setNbSheet(null);
  };

  // Bulkacties op de huidige selectie. `logEntriesRaw` (niet `filtered`) is
  // de bron: die bevat de volledige records, `filtered` alleen de weergave.
  const selectedEntries = () =>
    (logEntriesRaw ?? []).filter((e) => selectedIds.has(e.id));

  const bulk =
    (action) =>
    async (...args) => {
      await action(selectedEntries(), ...args);
      setConfirmBulkTrash(false);
      setMoveSheet(false);
      exitSelectMode();
    };

  const moodEmoji = (val) => MOODS.find((m) => m.value === val)?.emoji;

  // Lang indrukken op een kaart start de selectiemodus.
  const longPress = useLongPress((id) => {
    setSelectMode(true);
    setSelectedIds(new Set([id]));
  });

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
        notebook={isAll && isLog ? notebookOf(entry) : null}
        onToggleSelect={() => toggleSelect(entry.id)}
        onLongPressStart={longPress.start}
        onLongPressEnd={longPress.cancel}
        onClick={() => {
          if (longPress.consumeFired()) return; // telt niet ook als klik
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
      <NotesHeader
        selectMode={selectMode}
        selectedCount={selectedIds.size}
        onSelectAll={selectAllVisible}
        onCancelSelect={exitSelectMode}
        onMenu={() => setMenuSheet(true)}
        onNew={newNote}
      />

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

      <NotebookTabs
        notebooks={notebooks}
        activeId={activeId}
        isAll={isAll}
        onAll={() => switchNotebook(ALL)}
        onPick={(n, active) => (active ? setNbSheet(n) : switchNotebook(n.id))}
        onNew={() => setNbSheet("new")}
      />

      <TagFilter tags={allTags} active={activeTag} onChange={setActiveTag} />

      <NoteList
        {...reorder}
        sortMode={sortMode}
        filtering={!!(search || activeTag)}
        renderCard={renderCard}
      />

      {menuSheet && (
        <NotesMenuSheet
          sortMode={savedSort}
          onSort={setSortMode}
          onSelect={selectableIds.length > 0 ? () => setSelectMode(true) : null}
          onEditNotebook={isAll ? null : () => setNbSheet(activeNotebook)}
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
          notebookId={isAll ? "logboek" : activeId}
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
          onClose={() => setTemplatePicker(false)}
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
              ? removeNotebook
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
          onClose={() => setArchiveSheet(false)}
        />
      )}
      {trashSheet && (
        <TrashSheet
          entries={trashedEntries}
          notebookOf={notebookOf}
          onClose={() => setTrashSheet(false)}
        />
      )}
      {moveSheet && (
        <MoveSheet
          notebooks={notebooks}
          currentId={activeId}
          onPick={(id) => bulk(moveEntries)(id, logEntriesRaw ?? [])}
          onClose={() => setMoveSheet(false)}
        />
      )}
      {confirmBulkTrash && (
        <ConfirmDialog
          title="Naar prullenbak?"
          message={`${selectedIds.size} item(s) gaan naar de prullenbak en worden na 30 dagen definitief verwijderd.`}
          confirmLabel="Naar prullenbak"
          onCancel={() => setConfirmBulkTrash(false)}
          onConfirm={bulk(trashEntries)}
        />
      )}
      {selectMode && selectedIds.size > 0 && (
        <SelectionBar
          onPin={bulk(pinEntries)}
          onArchive={bulk(archiveEntries)}
          onMove={() => setMoveSheet(true)}
          onTrash={() => setConfirmBulkTrash(true)}
        />
      )}
    </div>
  );
}
