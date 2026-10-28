import { arrMove } from "../../hooks/useSortable.js";

// Plek in de eigen volgorde: `order` als die er is; anders telt de aanmaak-
// datum negatief mee, zodat nieuwe notities zonder order bovenaan komen
// (nieuwste eerst) vóór de geordende.
export const orderKey = (e) =>
  e.order !== undefined
    ? e.order
    : -new Date(e.createdAt || e.date + "T00:00").getTime();

// Notities uit één notitieboek (of "Alles"): vastgezet eerst, daarna op
// datum (laatst bewerkt eerst) of in de eigen volgorde.
export function sortNotes(list, sortMode) {
  return [...list].sort((a, b) => {
    const pinDiff = (b.pinnedAt ? 1 : 0) - (a.pinnedAt ? 1 : 0);
    if (pinDiff) return pinDiff;
    if (sortMode === "datum")
      return (b.updatedAt || b.date).localeCompare(a.updatedAt || a.date);
    return orderKey(a) - orderKey(b);
  });
}

// Herordent de volledige lijst op basis van een sleep in een (mogelijk
// gefilterde) deelverzameling: het gesleepte item komt in `fullList` naast
// dezelfde buur als in de nieuwe volgorde van `filteredList`, zodat
// onzichtbare (buiten het filter vallende) entries hun relatieve plek
// t.o.v. hun zichtbare buren behouden.
export function reorderWithinFull(fullList, filteredList, from, to) {
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
