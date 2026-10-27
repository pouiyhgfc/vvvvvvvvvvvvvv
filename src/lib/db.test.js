import Dexie from "dexie";
import { beforeEach, describe, expect, test } from "vitest";
import {
  DEFAULT_CAL_TEMPLATES,
  DEFAULT_ROUTINES,
  DEFAULT_SETTINGS,
} from "./constants.js";
import {
  db,
  migrateFromLocalStorage,
  migrateHifdSrsV2,
  migrateNotesOrderV1,
  migrateNotesToLogEntries,
  purgeTrash,
  seedHifd,
} from "./db.js";

const DAY = 24 * 60 * 60 * 1000;

beforeEach(async () => {
  await db.delete();
  await db.open();
  localStorage.clear();
});

describe("migrateFromLocalStorage", () => {
  test("zet alle rt_*-sleutels over naar Dexie en markeert de migratie", async () => {
    localStorage.setItem("rt_settings", JSON.stringify({ theme: "dark" }));
    localStorage.setItem("rt_areas", JSON.stringify([{ id: "x", name: "X" }]));
    localStorage.setItem("rt_routines", JSON.stringify({ ochtend: [] }));
    localStorage.setItem(
      "rt_cal_events",
      JSON.stringify([{ id: "e1", date: "2026-01-02", title: "Afspraak" }]),
    );
    localStorage.setItem(
      "rt_day_2026-01-02",
      JSON.stringify({ checked: { a: true }, mood: 4 }),
    );

    await migrateFromLocalStorage();

    expect(await db.settings.get("singleton")).toEqual({
      id: "singleton",
      ...DEFAULT_SETTINGS,
      theme: "dark",
    });
    expect((await db.blobs.get("areas")).data).toEqual([
      { id: "x", name: "X" },
    ]);
    expect((await db.blobs.get("routines")).data).toEqual({ ochtend: [] });
    expect(await db.calEvents.get("e1")).toMatchObject({ title: "Afspraak" });
    expect(await db.days.get("2026-01-02")).toEqual({
      date: "2026-01-02",
      checked: { a: true },
      mood: 4,
    });
    expect((await db.meta.get("migrated")).value).toBe(true);
  });

  test("corrupte JSON valt terug op de default zonder de rest te breken", async () => {
    localStorage.setItem("rt_cal_templates", "{kapot");
    localStorage.setItem("rt_routines", JSON.stringify({ avond: [] }));

    await migrateFromLocalStorage();

    expect((await db.blobs.get("calTemplates")).data).toEqual(
      DEFAULT_CAL_TEMPLATES,
    );
    expect((await db.blobs.get("routines")).data).toEqual({ avond: [] });
  });

  test("lege localStorage geeft de defaults", async () => {
    await migrateFromLocalStorage();
    expect((await db.blobs.get("routines")).data).toEqual(DEFAULT_ROUTINES);
  });

  test("draait maar één keer", async () => {
    await migrateFromLocalStorage();
    localStorage.setItem("rt_routines", JSON.stringify({ nieuw: [] }));
    await migrateFromLocalStorage();
    expect((await db.blobs.get("routines")).data).toEqual(DEFAULT_ROUTINES);
  });
});

describe("migrateNotesToLogEntries", () => {
  test("dagnotities worden logboek-entries en verdwijnen uit de dag", async () => {
    await db.days.put({
      date: "2026-03-01",
      notes: "regel 1\nregel 2",
      mood: 3,
    });

    await migrateNotesToLogEntries();

    const [entry] = await db.logEntries.toArray();
    expect(entry).toMatchObject({
      notebookId: "logboek",
      date: "2026-03-01",
      body: "regel 1\nregel 2",
    });
    expect(entry.doc).toHaveLength(2);
    expect(entry.doc[0].content[0].text).toBe("regel 1");
    expect(await db.days.get("2026-03-01")).toEqual({
      date: "2026-03-01",
      mood: 3,
    });
  });

  test("overschrijft geen bestaande logboek-entry op dezelfde datum", async () => {
    await db.days.put({ date: "2026-03-01", notes: "oud" });
    await db.logEntries.put({
      id: "bestaand",
      notebookId: "logboek",
      date: "2026-03-01",
      body: "nieuw",
    });

    await migrateNotesToLogEntries();

    expect(await db.logEntries.count()).toBe(1);
    expect((await db.logEntries.get("bestaand")).body).toBe("nieuw");
    expect((await db.days.get("2026-03-01")).notes).toBe("oud");
  });
});

describe("migrateNotesOrderV1", () => {
  test("geeft per notitieboek een volgorde, nieuwste eerst", async () => {
    await db.logEntries.bulkPut([
      {
        id: "a",
        notebookId: "logboek",
        date: "2026-01-01",
        createdAt: "2026-01-01T10:00:00Z",
      },
      {
        id: "b",
        notebookId: "logboek",
        date: "2026-01-03",
        createdAt: "2026-01-03T10:00:00Z",
      },
      {
        id: "c",
        notebookId: "studie",
        date: "2026-01-02",
        createdAt: "2026-01-02T10:00:00Z",
      },
      { id: "d", date: "2026-01-02", createdAt: "2026-01-02T10:00:00Z" },
    ]);

    await migrateNotesOrderV1();

    const order = Object.fromEntries(
      (await db.logEntries.toArray()).map((e) => [e.id, e.order]),
    );
    // "d" heeft geen notebookId → hoort bij logboek, tussen b en a in.
    expect(order).toEqual({ b: 0, d: 1, a: 2, c: 0 });
  });
});

describe("purgeTrash", () => {
  test("verwijdert alleen wat langer dan 30 dagen in de prullenbak staat", async () => {
    const ago = (days) => new Date(Date.now() - days * DAY).toISOString();
    await db.logEntries.bulkPut([
      { id: "oud", deletedAt: ago(31) },
      { id: "recent", deletedAt: ago(29) },
      { id: "actief" },
    ]);

    await purgeTrash();

    expect((await db.logEntries.toCollection().primaryKeys()).sort()).toEqual([
      "actief",
      "recent",
    ]);
  });
});

describe("Hifd", () => {
  test("seedHifd maakt 114 surahs aan, één keer", async () => {
    await seedHifd();
    expect(await db.hifd.count()).toBe(114);
    expect((await db.hifd.get(1)).status).toBe("todo");

    await db.hifd.update(1, { status: "memorized" });
    await seedHifd();
    expect((await db.hifd.get(1)).status).toBe("memorized");
  });

  test("migrateHifdSrsV2 leidt het interval af van de oude stap", async () => {
    await db.hifd.bulkPut([
      { surah: 1, status: "memorized", srsStep: 2 },
      { surah: 2, status: "learning", srsStep: 0 },
      { surah: 3, status: "memorized", easeFactor: 2.1, interval: 12, reps: 4 },
    ]);

    await migrateHifdSrsV2();

    expect(await db.hifd.get(1)).toMatchObject({
      easeFactor: 2.5,
      interval: 7,
      reps: 3,
    });
    expect(await db.hifd.get(2)).toMatchObject({
      easeFactor: 2.5,
      interval: 0,
      reps: 0,
    });
    expect(await db.hifd.get(3)).toMatchObject({
      easeFactor: 2.1,
      interval: 12,
      reps: 4,
    });
  });

  test("schema v3 → v5: hifdLog gaat met fase naar hifdLogV2", async () => {
    db.close();
    await Dexie.delete("routine-tracker");
    const old = new Dexie("routine-tracker");
    old.version(1).stores({
      meta: "&key",
      settings: "&id",
      blobs: "&key",
      days: "&date",
      calEvents: "&id, date",
    });
    old.version(2).stores({ logEntries: "&id, date, createdAt" });
    old.version(3).stores({
      hifd: "&surah, status, nextDue",
      hifdLog: "&[surah+date], surah, date",
    });
    await old.hifdLog.bulkPut([
      { surah: 1, date: "2026-02-01", verses: 3 },
      { surah: 2, date: "2026-02-01", phase: "review" },
    ]);
    old.close();

    await db.open();

    const rows = await db.hifdLogV2.toArray();
    expect(rows).toHaveLength(2);
    expect(rows.find((r) => r.surah === 1).phase).toBe("learn");
    expect(rows.find((r) => r.surah === 2).phase).toBe("review");
    expect(db.tables.map((t) => t.name)).not.toContain("hifdLog");
  });
});
