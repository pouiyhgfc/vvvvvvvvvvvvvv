import { db } from "../../lib/db.js";
import { isActive } from "../../lib/notes.js";
import { showToast } from "../../lib/toast.js";
import { nbOf } from "./noteHelpers.js";
import { orderKey } from "./noteOrder.js";

// Schrijfacties op notities (Dexie + korte melding). De weergave leest alles
// via useLiveQuery, dus na een actie is de lijst vanzelf bijgewerkt.

const now = () => new Date().toISOString();

// Eigen volgorde opslaan; `_type` is alleen voor de weergave.
export const saveOrder = (list) =>
  db.logEntries.bulkPut(
    list.map(({ _type: _t, ...rest }, i) => ({ ...rest, order: i })),
  );

export async function restoreFromArchive(id) {
  await db.logEntries.update(id, { archivedAt: null });
  showToast("✓ Teruggezet");
}
export async function archiveToTrash(id) {
  await db.logEntries.update(id, { archivedAt: null, deletedAt: now() });
  showToast("Naar prullenbak");
}
export async function restoreFromTrash(id) {
  await db.logEntries.update(id, { deletedAt: null });
  showToast("✓ Hersteld");
}
export async function purgeEntry(id) {
  await db.logEntries.delete(id);
  showToast("✓ Definitief verwijderd");
}
export async function purgeEntries(entries) {
  await db.logEntries.bulkDelete(entries.map((e) => e.id));
  showToast("✓ Prullenbak geleegd");
}

// Bulkacties op een selectie (volledige records).
export async function pinEntries(selected) {
  const allPinned = selected.every((e) => e.pinnedAt);
  const at = now();
  await db.logEntries.bulkPut(
    selected.map((e) => ({ ...e, pinnedAt: allPinned ? null : at })),
  );
  showToast(allPinned ? "Notities losgemaakt" : "Notities vastgezet");
}
export async function archiveEntries(selected) {
  await db.logEntries.bulkPut(
    selected.map((e) => ({ ...e, archivedAt: now(), pinnedAt: null })),
  );
  showToast(`${selected.length} gearchiveerd`);
}
export async function trashEntries(selected) {
  await db.logEntries.bulkPut(
    selected.map((e) => ({ ...e, deletedAt: now(), pinnedAt: null })),
  );
  showToast(`${selected.length} naar prullenbak`);
}
// Verplaatste entries komen bovenaan het doelnotitieboek te staan; de
// bestaande entries daar schuiven op (zelfde order-logica als elders).
export async function moveEntries(selected, targetNbId, allEntries) {
  const ids = new Set(selected.map((e) => e.id));
  const targetExisting = allEntries
    .filter((e) => nbOf(e) === targetNbId && isActive(e) && !ids.has(e.id))
    .sort((a, b) => orderKey(a) - orderKey(b));
  await db.logEntries.bulkPut([
    ...selected.map((e, i) => ({
      ...e,
      notebookId: targetNbId,
      order: i,
      pinnedAt: null,
    })),
    ...targetExisting.map((e, i) => ({ ...e, order: selected.length + i })),
  ]);
  showToast(`✓ ${selected.length} verplaatst`);
}

// Notitieboek weg: de notities erin gaan naar het Logboek.
export async function deleteNotebook(id, notebooks) {
  const toMove = await db.logEntries.filter((e) => nbOf(e) === id).toArray();
  if (toMove.length)
    await db.logEntries.bulkPut(
      toMove.map((e) => ({ ...e, notebookId: "logboek" })),
    );
  await db.blobs.put({
    key: "notebooks",
    data: notebooks.filter((n) => n.id !== id),
  });
  showToast("✓ Notitieboek verwijderd");
}
