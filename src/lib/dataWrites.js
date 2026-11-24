import { db } from "./db.js";
import { showToast } from "./toast.js";

// Lezen en schrijven in één transactie: twee snelle wijzigingen bouwen op
// elkaar voort, in plaats van allebei op de stand van de laatste render.

export const EMPTY_DAY = { checked: {}, energy: 7, mood: "Goed", notes: "" };

const apply = (updater, current) =>
  typeof updater === "function" ? updater(current) : updater;

export const updateBlob = (key, fallback, updater) =>
  db.transaction("rw", db.blobs, async () => {
    const current = (await db.blobs.get(key))?.data ?? fallback;
    await db.blobs.put({ key, data: apply(updater, current) });
  });

export const updateSettings = (fallback, updater) =>
  db.transaction("rw", db.settings, async () => {
    const current = (await db.settings.get("singleton")) ?? fallback;
    await db.settings.put({ id: "singleton", ...apply(updater, current) });
  });

export const updateCalEvents = (updater) =>
  db.transaction("rw", db.calEvents, async () => {
    const next = apply(updater, await db.calEvents.toArray());
    await db.calEvents.clear();
    if (next.length) await db.calEvents.bulkPut(next);
  });

export const toggleCheck = (date, id) =>
  db.transaction("rw", db.days, async () => {
    const day = (await db.days.get(date)) ?? EMPTY_DAY;
    const checked = { ...day.checked, [id]: !day.checked?.[id] };
    await db.days.put({ ...day, checked, date });
  });

export const SAVE_FAILED = "Opslaan mislukt. Is de opslag van je telefoon vol?";

// Een mislukte schrijfactie (bv. opslag vol) mag niet stil voorbijgaan.
export const reportSaveError = (promise) =>
  promise.catch((err) => {
    console.error("[opslaan]", err);
    showToast(SAVE_FAILED);
  });
