import Dexie from "dexie";
import {
  DEFAULT_ROUTINES,
  DEFAULT_AREAS,
  DEFAULT_CAL_TEMPLATES,
  DEFAULT_SETTINGS,
} from "./constants.js";
import { uid } from "./date.js";
import { SURAHS } from "./surahs.js";
import { INITIAL_EASE, LEGACY_INTERVALS } from "./hifd.js";

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

db.version(3).stores({
  hifd: "&surah, status, nextDue",
  hifdLog: "&[surah+date], surah, date",
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

export async function seedHifd() {
  try {
    const already = await db.meta.get("hifd_seeded");
    if (already) return;
    const count = await db.hifd.count();
    if (count > 0) {
      await db.meta.put({ key: "hifd_seeded", value: true });
      return;
    }
    const rows = SURAHS.map((s) => ({
      surah: s.id,
      versesKnown: 0,
      status: "todo",
      srsStep: 0,
      easeFactor: INITIAL_EASE,
      interval: 0,
      reps: 0,
      nextDue: null,
      lastReviewed: null,
      lapses: 0,
      dateStarted: null,
      dateMemorized: null,
    }));
    await db.hifd.bulkPut(rows);
    await db.meta.put({ key: "hifd_seeded", value: true });
  } catch (err) {
    console.error("[seedHifd]", err);
  }
}

// Eenmalige backfill van de SM-2-velden (easeFactor, interval, reps) op
// bestaande hifd-rijen die nog van het oude vaste-interval-systeem komen.
// Gememoriseerde surahs houden hun plek in de cyclus: interval wordt afgeleid
// van de oude srsStep zodat hun nextDue niet ineens reset.
export async function migrateHifdSrsV2() {
  try {
    const already = await db.meta.get("hifd_srs_v2");
    if (already) return;
    const rows = await db.hifd.toArray();
    await db.transaction("rw", db.hifd, async () => {
      for (const r of rows) {
        if (r.easeFactor != null) continue;
        const patch = { easeFactor: INITIAL_EASE, interval: 0, reps: 0 };
        if (r.status === "memorized") {
          const step = r.srsStep ?? 0;
          patch.interval = LEGACY_INTERVALS[step] ?? 1;
          patch.reps = step + 1;
        }
        await db.hifd.update(r.surah, patch);
      }
    });
    await db.meta.put({ key: "hifd_srs_v2", value: true });
  } catch (err) {
    console.error("[migrateHifdSrsV2]", err);
  }
}
