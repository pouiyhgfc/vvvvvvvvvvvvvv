import { db, seedHifd } from "./db.js";
import { dk } from "./date.js";
import { DEFAULT_NOTEBOOKS, DEFAULT_SETTINGS } from "./constants.js";
import { showToast } from "./toast.js";
import { BACKUP_VERSION, validateBackup } from "./validateBackup.js";
import { filesForBackup, filesFromBackup } from "./files.js";
import { shareJSON } from "./nativeFiles.js";
import { isNativeApp } from "./platform.js";

// Genereert en downloadt een JSON-bestand — gedeelde Blob/anchor-boilerplate
// voor alle export-functies hieronder. In de Android-app werkt een download
// niet (de WebView negeert hem): daar gaat het bestand via het deel-menu,
// zodat je het in Drive of Bestanden kunt bewaren.
function downloadJSON(filename, payload) {
  if (isNativeApp) return shareJSON(filename, payload);
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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
  const hifdData = await db.hifd.toArray();
  const hifdLogData = await db.hifdLogV2.toArray();
  downloadJSON(`routine-backup-${dk(new Date())}.json`, {
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
    hifd: hifdData,
    hifdLog: hifdLogData,
    files: await filesForBackup(),
  });
  // Voor de backup-herinnering. In meta (niet in settings), zodat het bij dit
  // toestel hoort en niet met een import wordt overschreven.
  await db.meta.put({ key: "lastExportAt", value: new Date().toISOString() });
}

export function exportRoutines(routines) {
  downloadJSON(`routines-${dk(new Date())}.json`, {
    version: 1,
    exportedAt: new Date().toISOString(),
    type: "routines",
    routines,
  });
}

export function exportWeekplanning({
  calTemplates,
  calEvents,
  weekScheduleTemplates,
}) {
  downloadJSON(`weekplanning-${dk(new Date())}.json`, {
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
  downloadJSON(`notities-${dk(new Date())}.json`, {
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
          if (data.logEntries.length)
            await db.logEntries.bulkPut(data.logEntries);
          if (Array.isArray(data.notebooks) && data.notebooks.length)
            await db.blobs.put({ key: "notebooks", data: data.notebooks });
          if (Array.isArray(data.entryTemplates) && data.entryTemplates.length)
            await db.blobs.put({
              key: "entryTemplates",
              data: data.entryTemplates,
            });
        });
        showToast("✓ Notities geïmporteerd.");
        return;
      }
      if (type === "routines") {
        if (!data.routines) {
          showToast("Geen routines gevonden in dit bestand.");
          return;
        }
        await db.blobs.put({ key: "routines", data: data.routines });
        showToast("✓ Routines geïmporteerd.");
        return;
      }
      if (type === "weekplanning") {
        if (data.calTemplates)
          await db.blobs.put({
            key: "calTemplates",
            data: data.calTemplates,
          });
        if (data.calEvents)
          await db.transaction("rw", db.calEvents, async () => {
            await db.calEvents.clear();
            if (data.calEvents.length)
              await db.calEvents.bulkPut(data.calEvents);
          });
        if (data.weekScheduleTemplates)
          await db.blobs.put({
            key: "weekTemplates",
            data: data.weekScheduleTemplates,
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
    async () => {
      if (!merge) {
        await db.files.clear();
        await db.days.clear();
        await db.calEvents.clear();
        await db.logEntries.clear();
        await db.hifd.clear();
        await db.hifdLogV2.clear();
        // Zonder deze reset zou seedHifd hieronder denken dat de 114 surahs er
        // al staan, en blijft Hifd leeg bij een backup zonder Hifd-gegevens.
        await db.meta.delete("hifd_seeded");
      }
      await db.blobs.put({ key: "routines", data: data.routines });
      if (data.calTemplates)
        await db.blobs.put({ key: "calTemplates", data: data.calTemplates });
      if (data.weekScheduleTemplates)
        await db.blobs.put({
          key: "weekTemplates",
          data: data.weekScheduleTemplates,
        });
      if (data.calEvents && data.calEvents.length)
        await db.calEvents.bulkPut(data.calEvents);
      if (data.settings)
        await db.settings.put({
          id: "singleton",
          ...DEFAULT_SETTINGS,
          ...data.settings,
        });
      if (Array.isArray(data.areas) && data.areas.length)
        await db.blobs.put({ key: "areas", data: data.areas });
      const dayEntries = Object.entries(data.days).map(([d, dayData]) => ({
        date: d,
        ...dayData,
      }));
      if (dayEntries.length) await db.days.bulkPut(dayEntries);
      if (Array.isArray(data.logEntries) && data.logEntries.length)
        await db.logEntries.bulkPut(data.logEntries);
      if (Array.isArray(data.notebooks) && data.notebooks.length)
        await db.blobs.put({ key: "notebooks", data: data.notebooks });
      if (Array.isArray(data.entryTemplates) && data.entryTemplates.length)
        await db.blobs.put({
          key: "entryTemplates",
          data: data.entryTemplates,
        });
      if (Array.isArray(data.hifd) && data.hifd.length)
        await db.hifd.bulkPut(data.hifd);
      if (Array.isArray(data.hifdLog) && data.hifdLog.length)
        await db.hifdLogV2.bulkPut(
          data.hifdLog.map((r) => ({ ...r, phase: r.phase || "learn" })),
        );
      if (files.length) await db.files.bulkPut(files);
    },
  );
  await seedHifd();
  // Een teruggezette backup telt als ingericht (geen welkomstscherm meer).
  await db.meta.put({ key: "onboarded", value: true });
  showToast(
    `✓ Import gelukt! ${Object.keys(data.days).length} dagen geïmporteerd.`,
  );
}
