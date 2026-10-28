import { useCallback, useMemo } from "react";
import { useSortable } from "../../hooks/useSortable.js";
import { saveOrder } from "./noteActions.js";
import { reorderWithinFull } from "./noteOrder.js";

const isPinned = (e) => e._type === "log" && e.pinnedAt;

// Slepen in de notitielijst. Vastgezette entries vormen een eigen sleep-
// sectie (zie ONTWERP): ze staan altijd boven de rest, en een sleep binnen
// de ene sectie mag de andere niet aanraken. Twee aparte useSortable-
// containers dwingen dat vanzelf af — elke hook scant alleen data-srow-rijen
// in zijn eigen ref. Slepen kan ook tijdens zoeken/filteren: de volgorde van
// onzichtbare entries blijft intact (zie reorderWithinFull).
export function useNoteReorder(allEntries, filtered) {
  const pinned = useMemo(() => filtered.filter(isPinned), [filtered]);
  const rest = useMemo(() => filtered.filter((e) => !isPinned(e)), [filtered]);
  const pinnedAll = useMemo(() => allEntries.filter(isPinned), [allEntries]);
  const restAll = useMemo(
    () => allEntries.filter((e) => !isPinned(e)),
    [allEntries],
  );

  const onReorderPinned = useCallback(
    (from, to) => saveOrder(reorderWithinFull(pinnedAll, pinned, from, to)),
    [pinnedAll, pinned],
  );
  const onReorderRest = useCallback(
    (from, to) => {
      const log = (list) => list.filter((e) => e._type === "log");
      return saveOrder(reorderWithinFull(log(restAll), log(rest), from, to));
    },
    [restAll, rest],
  );

  const pinnedSort = useSortable(onReorderPinned);
  const restSort = useSortable(onReorderRest);
  return {
    pinned,
    rest,
    pinnedRef: pinnedSort.ref,
    restRef: restSort.ref,
    onPinnedHandleDown: pinnedSort.onHandleDown,
    onRestHandleDown: restSort.onHandleDown,
  };
}
