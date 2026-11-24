import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { DEFAULT_SETTINGS } from "./constants.js";
import { db, fillSearchText, seedHifd } from "./db.js";
import { exportData, importData, performFullImport } from "./backup.js";

// exportData downloadt via een <a>-klik; vang de Blob op in plaats daarvan.
let downloaded;
beforeEach(async () => {
  await db.delete();
  await db.open();
  downloaded = null;
  vi.stubGlobal("document", {
    createElement: () => ({ click() {} }),
    body: { appendChild() {}, removeChild() {} },
  });
  vi.spyOn(URL, "createObjectURL").mockImplementation((blob) => {
    downloaded = blob;
    return "blob:test";
  });
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function seed() {
  await db.settings.put({
    id: "singleton",
    ...DEFAULT_SETTINGS,
    theme: "dark",
  });
  await db.blobs.bulkPut([
    { key: "routines", data: { ochtend: [{ id: "r1", name: "Fajr" }] } },
    { key: "areas", data: [{ id: "a1", name: "Deen" }] },
    { key: "calTemplates", data: [{ id: "t1", title: "Les" }] },
    { key: "weekTemplates", data: [{ id: "w1", events: [] }] },
    {
      key: "notebooks",
      data: [
        { id: "logboek", name: "Logboek" },
        { id: "studie", name: "Studie" },
      ],
    },
    { key: "entryTemplates", data: [{ id: "s1", name: "Reflectie" }] },
  ]);
  await db.days.bulkPut([
    { date: "2026-10-26", checked: { r1: true }, mood: 4 },
    { date: "2026-10-27", energy: 3 },
  ]);
  await db.calEvents.put({ id: "e1", date: "2026-10-27", title: "College" });
  await db.logEntries.put({
    id: "n1",
    notebookId: "studie",
    date: "2026-10-27",
    title: "Spoor",
    doc: [
      {
        type: "paragraph",
        content: [{ type: "text", text: "ballast", styles: {} }],
      },
    ],
    body: "ballast",
    tags: ["rte"],
  });
  await seedHifd();
  await db.hifd.update(1, {
    status: "memorized",
    interval: 7,
    nextDue: "2026-11-01",
  });
  await db.hifdLogV2.put({
    surah: 1,
    date: "2026-10-27",
    phase: "review",
    rating: "goed",
    mistakes: "1-2",
  });
}

async function snapshot() {
  const out = {};
  for (const t of [
    "settings",
    "blobs",
    "days",
    "calEvents",
    "logEntries",
    "hifd",
    "hifdLogV2",
  ]) {
    out[t] = await db.table(t).toArray();
  }
  return out;
}

// Zelfde aanroep als App.jsx doet bij "Exporteer alles".
async function exportAll() {
  const blob = (key) => db.blobs.get(key).then((b) => b?.data);
  await exportData({
    routines: await blob("routines"),
    areas: await blob("areas"),
    calTemplates: await blob("calTemplates"),
    calEvents: await db.calEvents.toArray(),
    weekScheduleTemplates: await blob("weekTemplates"),
    settings: await db.settings.get("singleton"),
    allDaysRaw: await db.days.toArray(),
  });
  return JSON.parse(await downloaded.text());
}

describe("volledige backup", () => {
  test("export → alles wissen → import (vervangen) geeft dezelfde data terug", async () => {
    await seed();
    await fillSearchText(); // zoals bij het opstarten van de app
    const before = await snapshot();
    const backup = await exportAll();
    expect(backup.version).toBe(14);

    await db.delete();
    await db.open();
    await performFullImport(backup, false);

    expect(await snapshot()).toEqual(before);
  });

  test("taken gaan mee in de backup en komen terug", async () => {
    await seed();
    await db.tasks.bulkPut([
      { id: "t1", title: "Fiets", horizon: "kort", parentId: null },
      { id: "t2", title: "Stap", horizon: "kort", parentId: "t1" },
    ]);
    const backup = await exportAll();
    expect(backup.tasks).toHaveLength(2);
    await db.delete();
    await db.open();
    await performFullImport(backup, false);
    expect(await db.tasks.count()).toBe(2);
  });

  test("een backup zonder taken importeert en wist bestaande taken bij vervangen", async () => {
    await seed();
    const backup = await exportAll();
    delete backup.tasks;
    await db.tasks.put({ id: "oud", title: "oud" });
    await performFullImport(backup, false);
    expect(await db.tasks.count()).toBe(0);
  });

  test("koppelingen tag → focusgebied gaan mee in de backup", async () => {
    await seed();
    await db.blobs.put({ key: "tagMeta", data: { hifd: { area: "Quran" } } });
    const backup = await exportAll();
    expect(backup.tagMeta).toEqual({ hifd: { area: "Quran" } });
    await db.delete();
    await db.open();
    await performFullImport(backup, false);
    expect((await db.blobs.get("tagMeta")).data).toEqual({
      hifd: { area: "Quran" },
    });
  });

  test("een notitie uit een oudere backup krijgt bij import zijn zoektekst", async () => {
    await seed();
    const backup = await exportAll();
    const note = backup.logEntries.find((e) => Array.isArray(e.doc));
    delete note.searchText;
    await db.delete();
    await db.open();
    await performFullImport(backup, false);
    expect((await db.logEntries.get(note.id)).searchText).toBeTruthy();
  });

  test("samenvoegen houdt bestaande entries die niet in de backup staan", async () => {
    await seed();
    const backup = await exportAll();
    await db.logEntries.put({
      id: "n2",
      date: "2026-10-28",
      body: "na de export",
    });

    await performFullImport(backup, true);

    expect(await db.logEntries.get("n2")).toBeTruthy();
    expect(await db.logEntries.get("n1")).toBeTruthy();
  });

  // Was een bug: samenvoegen overschreef nieuwere data met de oudere backup.
  test("samenvoegen laat wat je na de export veranderde staan", async () => {
    await seed();
    await db.tasks.put({ id: "k1", title: "Verslag", doneAt: null });
    const backup = await exportAll();
    await db.logEntries.update("n1", { body: "nieuwer" });
    await db.hifd.update(2, { status: "memorized" });
    await db.tasks.update("k1", { doneAt: "2026-10-28T10:00:00.000Z" });
    await db.blobs.put({
      key: "routines",
      data: {
        ochtend: [
          { id: "r1", name: "Fajr" },
          { id: "r2", name: "Sport" },
        ],
      },
    });
    await db.blobs.put({ key: "areas", data: [{ id: "a9", name: "Nieuw" }] });

    await performFullImport(backup, true);

    expect((await db.logEntries.get("n1")).body).toBe("nieuwer");
    expect((await db.hifd.get(2)).status).toBe("memorized");
    expect((await db.tasks.get("k1")).doneAt).toBeTruthy();
    const routines = (await db.blobs.get("routines")).data;
    expect(routines.ochtend.map((r) => r.id)).toEqual(["r1", "r2"]);
    const areas = (await db.blobs.get("areas")).data;
    expect(areas.map((a) => a.id)).toEqual(["a9", "a1"]);
  });

  test("samenvoegen op een nieuw toestel neemt de Hifd-voortgang over", async () => {
    await seed();
    const backup = await exportAll();
    await db.delete();
    await db.open();
    await seedHifd();

    await performFullImport(backup, true);

    expect((await db.hifd.get(1)).status).toBe("memorized");
    expect(await db.logEntries.get("n1")).toBeTruthy();
  });

  test("een oude backup (v1, nog zonder logboek en Hifd) importeert met samenvoegen", async () => {
    await seed();
    const v1 = {
      version: 1,
      routines: { ochtend: [], middag: [], avond: [] },
      areas: [{ id: "a2", name: "Studie" }],
      days: { "2026-01-01": { mood: 2 } },
      calEvents: [],
      settings: { theme: "light" },
    };

    await performFullImport(v1, true);

    expect((await db.days.get("2026-01-01")).mood).toBe(2);
    expect(await db.hifd.count()).toBe(114);
    expect(await db.logEntries.get("n1")).toBeTruthy();
  });

  // Was een bug: "vervangen" met een backup zonder Hifd leegde de tabel en
  // vulde hem niet opnieuw, waardoor de Hifd-pagina leeg bleef.
  test("vervangen met een backup zonder Hifd laat 114 surahs staan", async () => {
    await seed();
    const v1 = {
      version: 1,
      routines: { ochtend: [], middag: [], avond: [] },
      days: {},
    };

    await performFullImport(v1, false);

    expect(await db.hifd.count()).toBe(114);
  });
});

// importData leest via FileReader; deze vervanging geeft de tekst direct door.
async function importFile(payload) {
  let done;
  vi.stubGlobal(
    "FileReader",
    class {
      readAsText(text) {
        done = this.onload({ target: { result: text } });
      }
    },
  );
  importData(JSON.stringify(payload), () => {});
  await done;
}

describe("deel-import", () => {
  test("een weekplanning-bestand vult aan en wist geen bestaande blokken", async () => {
    await seed();
    await importFile({
      type: "weekplanning",
      calEvents: [{ id: "e2", date: "2026-10-28", title: "Sport" }],
    });

    expect(await db.calEvents.get("e1")).toBeTruthy();
    expect(await db.calEvents.get("e2")).toBeTruthy();
  });

  test("een notities-bestand overschrijft een nieuwere notitie niet", async () => {
    await seed();
    await importFile({
      type: "notities",
      logEntries: [{ id: "n1", date: "2026-10-27", body: "oud" }],
    });

    expect((await db.logEntries.get("n1")).body).toBe("ballast");
  });
});
