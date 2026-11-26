import { db, fillSearchText, seedHifd } from "./db.js";
import { dk } from "./date.js";
import { DEFAULT_NOTEBOOKS, DEFAULT_SETTINGS } from "./constants.js";
import { showToast } from "./toast.js";
import { BACKUP_VERSION, validateBackup } from "./validateBackup.js";
import { filesForBackup, filesFromBackup } from "./files.js";
import { addMissingBlob, addMissingRows } from "./backupMerge.js";
import { downloadText } from "./download.js";

// Genereert en downloadt een JSON-bestand — gedeelde Blob/anchor-boilerplate
// voor alle export-functies hieronder. In de Android-app werkt een download
// niet (de WebView negeert hem): daar komt het in Documenten/Routine.
const downloadJSON = (filename, payload) =>
  downloadText(filename, JSON.stringify(payload, null, 2), "application/json");

// Datum én tijd in de naam: een tweede backup op dezelfde dag (zoals de
// veiligheidsbackup vóór "vervangen") overschrijft de eerste niet.
function stamp() {
  const d = new Date();
  const two = (n) => String(n).padStart(2, "0");
  return `${dk(d)}-${two(d.getHours())}${two(d.getMinutes())}${two(d.getSeconds())}`;
}

export async function exportData({
  routines,
  areas,
  calTemplates,
  calEvents,
  weekScheduleTemplates,
  settings,
  allDaysRaw,
}) {
  const allDaysForExport = {};
  (allDaysRaw ?? []).forEach((e) => {
    const { date: d, ...rest } = e;
    allDaysForExport[d] = rest;
  });
  const logEntries = await db.logEntries.toArray();
  const notebooksBlob = await db.blobs.get("notebooks");
  const entryTemplatesBlob = await db.blobs.get("entryTemplates");
  const tagMetaBlob = await db.blobs.get("tagMeta");
  const hifdData = await db.hifd.toArray();
  const hifdLogData = await db.hifdLogV2.toArray();
  await downloadJSON(`routine-backup-${stamp()}.json`, {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    routines,
    areas,
    calTemplates,
    calEvents,
    weekScheduleTemplates,
    settings,
    days: allDaysForExport,
    logEntries,
    notebooks: notebooksBlob?.data ?? DEFAULT_NOTEBOOKS,
    entryTemplates: entryTemplatesBlob?.data ?? [],
    tagMeta: tagMetaBlob?.data ?? {},
    tasks: await db.tasks.toArray(),
    hifd: hifdData,
    hifdLog: hifdLogData,
    files: await filesForBackup(),
  });
  // Voor de backup-herinnering. In meta (niet in settings), zodat het bij dit
  // toestel hoort en niet met een import wordt overschreven.
  await db.meta.put({ key: "lastExportAt", value: new Date().toISOString() });
}

export async function exportRoutines(routines) {
  await downloadJSON(`routines-${stamp()}.json`, {
    version: 1,
    exportedAt: new Date().toISOString(),
    type: "routines",
    routines,
  });
}

export async function exportWeekplanning({
  calTemplates,
  calEvents,
  weekScheduleTemplates,
}) {
  await downloadJSON(`weekplanning-${stamp()}.json`, {
    version: 1,
    exportedAt: new Date().toISOString(),
    type: "weekplanning",
    calTemplates,
    calEvents,
    weekScheduleTemplates,
  });
}

export async function exportNotities() {
  const logEntries = await db.logEntries.toArray();
  const notebooksBlob = await db.blobs.get("notebooks");
  const entryTemplatesBlob = await db.blobs.get("entryTemplates");
  await downloadJSON(`notities-${stamp()}.json`, {
    version: 1,
    exportedAt: new Date().toISOString(),
    type: "notities",
    logEntries,
    notebooks: notebooksBlob?.data ?? DEFAULT_NOTEBOOKS,
    entryTemplates: entryTemplatesBlob?.data ?? [],
  });
}

// Leest en valideert het bestand. Deel-imports (routines/weekplanning/
// notities) voert deze functie direct door; voor een volledige backup wordt
// de geparste data doorgegeven aan `onFullBackup` zodat de aanroeper de
// samenvoegen/vervangen-keuze kan tonen (die beslissing hoort bij de UI).
export function importData(file, onFullBackup) {
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result);
      const problems = validateBackup(data);
      if (problems.length) {
        showToast(`Backup afgekeurd, er is niets gewijzigd. ${problems[0]}`);
        return;
      }
      const type = data.type || "full";
      if (
        !data.routines &&
        !data.days &&
        !data.calEvents &&
        !data.weekScheduleTemplates &&
        !data.logEntries
      ) {
        showToast("Ongeldig backup bestand.");
        return;
      }
      if (type === "notities") {
        if (!Array.isArray(data.logEntries)) {
          showToast("Geen notities gevonden in dit bestand.");
          return;
        }
        await db.transaction("rw", db.blobs, db.logEntries, async () => {
          await putNotes(data, write(true));
        });
        showToast("✓ Notities geïmporteerd.");
        return;
      }
      if (type === "routines") {
        if (!data.routines) {
          showToast("Geen routines gevonden in dit bestand.");
          return;
        }
        await addMissingBlob("routines", data.routines);
        showToast("✓ Routines geïmporteerd.");
        return;
      }
      if (type === "weekplanning") {
        await db.transaction("rw", db.blobs, db.calEvents, async () => {
          if (data.calTemplates)
            await addMissingBlob("calTemplates", data.calTemplates);
          await addMissingRows(db.calEvents, data.calEvents);
          if (data.weekScheduleTemplates)
            await addMissingBlob("weekTemplates", data.weekScheduleTemplates);
        });
        showToast("✓ Weekplanning geïmporteerd.");
        return;
      }
      if (!data.routines || !data.days) {
        showToast("Ongeldig backup bestand.");
        return;
      }
      onFullBackup(data);
    } catch (err) {
      showToast("Fout bij importeren: " + err.message);
    }
  };
  reader.readAsText(file);
}

// Samenvoegen vult alleen aan (zie backupMerge.js); vervangen schrijft alles.
const write = (merge) =>
  merge
    ? { rows: addMissingRows, blob: addMissingBlob }
    : {
        rows: (table, rows) => table.bulkPut(rows),
        blob: (key, data) => db.blobs.put({ key, data }),
      };

// Notities, notitieboeken en sjablonen uit een backup (binnen een transactie
// met db.logEntries en db.blobs).
async function putNotes(data, w) {
  if (Array.isArray(data.logEntries) && data.logEntries.length)
    await w.rows(db.logEntries, data.logEntries);
  if (Array.isArray(data.notebooks) && data.notebooks.length)
    await w.blob("notebooks", data.notebooks);
  if (Array.isArray(data.entryTemplates) && data.entryTemplates.length)
    await w.blob("entryTemplates", data.entryTemplates);
  if (isPlainObject(data.tagMeta) && Object.keys(data.tagMeta).length)
    await w.blob("tagMeta", data.tagMeta);
}

const isPlainObject = (v) =>
  v !== null && typeof v === "object" && !Array.isArray(v);

// Voert de volledige-backup-import uit (samenvoegen of vervangen). Werpt
// door bij een fout — de aanroeper toont de foutmelding en ruimt eigen
// UI-state op (bv. het sluiten van de keuze-dialoog).
export async function performFullImport(data, merge) {
  const files = await filesFromBackup(data.files);
  await db.transaction(
    "rw",
    db.blobs,
    db.days,
    db.calEvents,
    db.settings,
    db.logEntries,
    db.hifd,
    db.hifdLogV2,
    db.meta,
    db.files,
    db.tasks,
    async () => {
      const w = write(merge);
      if (!merge) {
        await db.tasks.clear();
        await db.files.clear();
        await db.days.clear();
        await db.calEvents.clear();
        await db.logEntries.clear();
        await db.hifd.clear();
        await db.hifdLogV2.clear();
        // Zonder deze reset zou seedHifd hieronder denken dat de 114 surahs er
        // al staan, en blijft Hifd leeg bij een backup zonder Hifd-gegevens.
        await db.meta.delete("hifd_seeded");
        await db.blobs.delete("tagMeta");
      }
      await w.blob("routines", data.routines);
      if (data.calTemplates) await w.blob("calTemplates", data.calTemplates);
      if (data.weekScheduleTemplates)
        await w.blob("weekTemplates", data.weekScheduleTemplates);
      if (data.calEvents && data.calEvents.length)
        await w.rows(db.calEvents, data.calEvents);
      const keepSettings = merge && (await db.settings.get("singleton"));
      if (data.settings && !keepSettings)
        await db.settings.put({
          id: "singleton",
          ...DEFAULT_SETTINGS,
          ...data.settings,
        });
      if (Array.isArray(data.areas) && data.areas.length)
        await w.blob("areas", data.areas);
      const dayEntries = Object.entries(data.days).map(([d, dayData]) => ({
        date: d,
        ...dayData,
      }));
      if (dayEntries.length) await w.rows(db.days, dayEntries);
      await putNotes(data, w);
      if (Array.isArray(data.hifd) && data.hifd.length)
        await w.rows(db.hifd, data.hifd);
      if (Array.isArray(data.hifdLog) && data.hifdLog.length)
        await w.rows(
          db.hifdLogV2,
          data.hifdLog.map((r) => ({ ...r, phase: r.phase || "learn" })),
        );
      if (files.length) await w.rows(db.files, files);
      if (Array.isArray(data.tasks) && data.tasks.length)
        await w.rows(db.tasks, data.tasks);
    },
  );
  await seedHifd();
  await fillSearchText();
  // Een teruggezette backup telt als ingericht (geen welkomstscherm meer).
  await db.meta.put({ key: "onboarded", value: true });
  showToast(
    `✓ Import gelukt! ${Object.keys(data.days).length} dagen geïmporteerd.`,
  );
}
