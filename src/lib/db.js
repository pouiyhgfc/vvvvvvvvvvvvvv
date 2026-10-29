import Dexie from "dexie";
import { docText } from "./docText.js";
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

// v3's hifdLog-sleutel [surah+date] laat maar één record per surah per dag
// toe, ongeacht fase — een leersessie en een revisie op dezelfde dag
// overschrijven elkaar. Fase in de sleutel opnemen lost dat op; Dexie kan
// de primary key van een bestaande tabel niet wijzigen, dus via een
// tabel-vervanging (hifdLogV2 erbij, daarna hifdLog weg).
db.version(4)
  .stores({ hifdLogV2: "&[surah+date+phase], surah, date" })
  .upgrade(async (tx) => {
    const rows = await tx.table("hifdLog").toArray();
    await tx
      .table("hifdLogV2")
      .bulkPut(rows.map((r) => ({ ...r, phase: r.phase || "learn" })));
  });
db.version(5).stores({ hifdLog: null });

// Afbeeldingen in notities (verkleind), los van de notitie zelf: een
// notitie verwijst ernaar met "rtfile:<id>" (zie files.js).
db.version(6).stores({ files: "&id" });

// Parseert een localStorage-item veilig: één corrupt item mag de rest van de
// migratie niet meeslepen (valt terug op `fallback` i.p.v. te throwen).
function safeParse(raw, fallback) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error(
      "[migrateFromLocalStorage] corrupt JSON, val terug op default",
      err,
    );
    return fallback;
  }
}

// Installaties van vóór het welkomstscherm hoeven niet opnieuw ingericht te
// worden. Draait één keer en vóór migrateFromLocalStorage (die "migrated" zet).
export async function markExistingInstall() {
  if (await db.meta.get("welcome_checked")) return;
  if (await db.meta.get("migrated"))
    await db.meta.put({ key: "onboarded", value: true });
  await db.meta.put({ key: "welcome_checked", value: true });
}

export async function migrateFromLocalStorage() {
  const already = await db.meta.get("migrated");
  if (already) return;

  // settings
  const rawSettings = localStorage.getItem("rt_settings");
  await db.settings.put({
    id: "singleton",
    ...DEFAULT_SETTINGS,
    ...safeParse(rawSettings, {}),
  });

  // areas
  const rawAreas = localStorage.getItem("rt_areas");
  const parsedAreas = safeParse(rawAreas, null);
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
    data: safeParse(rawRoutines, DEFAULT_ROUTINES),
  });

  // calTemplates
  const rawCalTpls = localStorage.getItem("rt_cal_templates");
  await db.blobs.put({
    key: "calTemplates",
    data: safeParse(rawCalTpls, DEFAULT_CAL_TEMPLATES),
  });

  // weekTemplates
  const rawWeekTpls = localStorage.getItem("rt_week_schedule_tpls");
  await db.blobs.put({
    key: "weekTemplates",
    data: safeParse(rawWeekTpls, []),
  });

  // calEvents (individuele records)
  const rawCalEvents = localStorage.getItem("rt_cal_events");
  const calEvents = safeParse(rawCalEvents, []);
  if (calEvents.length) await db.calEvents.bulkPut(calEvents);

  // days
  const dayEntries = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith("rt_day_")) {
      const data = safeParse(localStorage.getItem(k), null);
      if (data) dayEntries.push({ date: k.replace("rt_day_", ""), ...data });
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
// Fouten worden opgevangen door runStartup (main.jsx).
export async function migrateNotesToLogEntries() {
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
}

// Eenmalige migratie: elke log-entry krijgt een expliciete `order` (per
// notitieboek), gebaseerd op de huidige weergavevolgorde (dezelfde regel als
// LogbookView: order asc indien aanwezig, anders nieuwste-eerst op
// createdAt/date). Zonder deze stap bestaat "de volgorde" van een notitieboek
// pas zodra je er handmatig in sleept — pin/archief/prullenbak hebben een
// stabiele order nodig vanaf het begin.
export async function migrateNotesOrderV1() {
  const already = await db.meta.get("notes_order_v1");
  if (already) return;
  const all = await db.logEntries.toArray();
  const byNotebook = new Map();
  for (const e of all) {
    const nb = e.notebookId || "logboek";
    if (!byNotebook.has(nb)) byNotebook.set(nb, []);
    byNotebook.get(nb).push(e);
  }
  const updates = [];
  for (const entries of byNotebook.values()) {
    const sorted = [...entries].sort((a, b) => {
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
    sorted.forEach((e, i) => updates.push({ ...e, order: i }));
  }
  if (updates.length) await db.logEntries.bulkPut(updates);
  await db.meta.put({ key: "notes_order_v1", value: true });
}

// Verwijdert log-entries die langer dan 30 dagen in de prullenbak staan
// (deletedAt gezet). Draait bij elke app-start.
const TRASH_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
export async function purgeTrash() {
  const cutoff = Date.now() - TRASH_RETENTION_MS;
  const toPurge = await db.logEntries
    .filter((e) => !!e.deletedAt && new Date(e.deletedAt).getTime() < cutoff)
    .primaryKeys();
  if (toPurge.length) await db.logEntries.bulkDelete(toPurge);
}

// Vult `searchText` (platte tekst voor zoeken, zie docText.js) voor notities
// die hem nog niet hebben: bestaande notities en na een import van een oudere
// backup. Raakt alleen ontbrekende velden; `body` blijft zoals hij is.
export async function fillSearchText() {
  const missing = await db.logEntries
    .filter((e) => Array.isArray(e.doc) && e.searchText === undefined)
    .toArray();
  if (missing.length)
    await db.logEntries.bulkPut(
      missing.map((e) => ({ ...e, searchText: docText(e.doc) })),
    );
}

export async function seedHifd() {
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
}

// Eenmalige backfill van de SM-2-velden (easeFactor, interval, reps) op
// bestaande hifd-rijen die nog van het oude vaste-interval-systeem komen.
// Gememoriseerde surahs houden hun plek in de cyclus: interval wordt afgeleid
// van de oude srsStep zodat hun nextDue niet ineens reset.
export async function migrateHifdSrsV2() {
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
}
