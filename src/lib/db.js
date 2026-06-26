import Dexie from "dexie";
import {
  DEFAULT_ROUTINES,
  DEFAULT_AREAS,
  DEFAULT_CAL_TEMPLATES,
  DEFAULT_SETTINGS,
} from "./constants.js";
import { uid } from "./date.js";

export const db = new Dexie("routine-tracker");

db.version(1).stores({
  meta: "&key",
  settings: "&id",
  blobs: "&key",
  days: "&date",
  calEvents: "&id, date",
});

db.version(2).stores({
  logEntries: "&id, date, createdAt",
});

export async function migrateFromLocalStorage() {
  const already = await db.meta.get("migrated");
  if (already) return;

  // settings
  const rawSettings = localStorage.getItem("rt_settings");
  await db.settings.put({
    id: "singleton",
    ...DEFAULT_SETTINGS,
    ...(rawSettings ? JSON.parse(rawSettings) : {}),
  });

  // areas
  const rawAreas = localStorage.getItem("rt_areas");
  const parsedAreas = rawAreas ? JSON.parse(rawAreas) : null;
  await db.blobs.put({
    key: "areas",
    data:
      Array.isArray(parsedAreas) && parsedAreas.length
        ? parsedAreas
        : DEFAULT_AREAS,
  });

  // routines
  const rawRoutines = localStorage.getItem("rt_routines");
  await db.blobs.put({
    key: "routines",
    data: rawRoutines ? JSON.parse(rawRoutines) : DEFAULT_ROUTINES,
  });

  // calTemplates
  const rawCalTpls = localStorage.getItem("rt_cal_templates");
  await db.blobs.put({
    key: "calTemplates",
    data: rawCalTpls ? JSON.parse(rawCalTpls) : DEFAULT_CAL_TEMPLATES,
  });

  // weekTemplates
  const rawWeekTpls = localStorage.getItem("rt_week_schedule_tpls");
  await db.blobs.put({
    key: "weekTemplates",
    data: rawWeekTpls ? JSON.parse(rawWeekTpls) : [],
  });

  // calEvents (individuele records)
  const rawCalEvents = localStorage.getItem("rt_cal_events");
  const calEvents = rawCalEvents ? JSON.parse(rawCalEvents) : [];
  if (calEvents.length) await db.calEvents.bulkPut(calEvents);

  // days
  const dayEntries = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith("rt_day_")) {
      try {
        const data = JSON.parse(localStorage.getItem(k) || "{}");
        dayEntries.push({ date: k.replace("rt_day_", ""), ...data });
      } catch {}
    }
  }
  if (dayEntries.length) await db.days.bulkPut(dayEntries);

  await db.meta.put({ key: "migrated", value: true });
}

// Converteert platte tekst naar BlockNote-paragraafblokken (één blok per regel).
function notesToBlocks(text) {
  return text.split("\n").map((line) => ({
    type: "paragraph",
    content: line.trim() ? [{ type: "text", text: line, styles: {} }] : [],
  }));
}

// Eenmalige migratie: days.notes → db.logEntries (BlockNote-formaat).
// Faalt geruisloos zodat het opstarten van de app nooit blokkeert.
export async function migrateNotesToLogEntries() {
  try {
    const already = await db.meta.get("migrated_notes_v1");
    if (already) return;

    const daysWithNotes = await db.days
      .filter((d) => typeof d.notes === "string" && d.notes.trim().length > 0)
      .toArray();

    if (!daysWithNotes.length) {
      await db.meta.put({ key: "migrated_notes_v1", value: true });
      return;
    }

    // Bepaal welke datums al een logboek-entry hebben (voorkom overschrijven).
    const existingByDate = new Set(
      (
        await db.logEntries
          .filter((e) => (e.notebookId || "logboek") === "logboek")
          .toArray()
      ).map((e) => e.date),
    );

    const toMigrate = daysWithNotes.filter((d) => !existingByDate.has(d.date));

    await db.transaction("rw", [db.days, db.logEntries], async () => {
      for (const record of toMigrate) {
        const now = new Date(record.date + "T12:00:00").toISOString();
        await db.logEntries.put({
          id: uid(),
          notebookId: "logboek",
          date: record.date,
          title: "",
          body: record.notes.trim(),
          doc: notesToBlocks(record.notes),
          tags: [],
          mood: null,
          createdAt: now,
          updatedAt: now,
        });
        const { notes: _removed, ...rest } = record;
        await db.days.put(rest);
      }
    });

    await db.meta.put({ key: "migrated_notes_v1", value: true });
  } catch (err) {
    console.error("[migrateNotesToLogEntries]", err);
  }
}
