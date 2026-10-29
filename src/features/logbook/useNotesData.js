import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../lib/db.js";
import { isActive, isArchived, isTrashed } from "../../lib/notes.js";
import { tagStats } from "../../lib/tags.js";
import { nbOf } from "./noteHelpers.js";
import { sortNotes } from "./noteOrder.js";

const newestFirst = (field) => (a, b) =>
  (b[field] || "").localeCompare(a[field] || "");

// De notities voor het gekozen notitieboek (of "Alles"), met de dagnotities
// uit de tracker, de tags van dat boek en archief/prullenbak (over alle
// notitieboeken heen, met het notitieboek als label op de kaart).
export function useNotesData({ activeId, isAll, sortMode }) {
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

  const archivedEntries = useMemo(
    () =>
      (logEntriesRaw ?? []).filter(isArchived).sort(newestFirst("archivedAt")),
    [logEntriesRaw],
  );
  const trashedEntries = useMemo(
    () =>
      (logEntriesRaw ?? []).filter(isTrashed).sort(newestFirst("deletedAt")),
    [logEntriesRaw],
  );

  return {
    logEntriesRaw,
    allEntries,
    allTags,
    archivedEntries,
    trashedEntries,
  };
}
