import { beforeEach, describe, expect, test } from "vitest";
import { db } from "../../lib/db.js";
import { addTask, deleteTask, moveToToday, toggleDone } from "./taskStore.js";

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe("taskStore", () => {
  test("nieuwe taken krijgen oplopende volgorde per lijst", async () => {
    const a = await addTask({ title: "a", horizon: "kort" });
    const b = await addTask({ title: "b", horizon: "kort" });
    const c = await addTask({ title: "c", horizon: "lang" });
    const [ta, tb, tc] = await db.tasks.bulkGet([a, b, c]);
    expect(tb.order).toBe(ta.order + 1);
    expect(tc.order).toBe(0);
    expect(ta).toMatchObject({ doneAt: null, parentId: null });
  });

  test("een hoofdtaak verwijderen neemt de stappen mee", async () => {
    const p = await addTask({ title: "p", horizon: "lang" });
    await addTask({ title: "s1", parentId: p });
    await addTask({ title: "s2", parentId: p });
    await deleteTask(p);
    expect(await db.tasks.count()).toBe(0);
  });

  // Een taak met stappen vink je niet zelf af (anders gebeurt dat per
  // ongeluk): hij is klaar zodra alle stappen klaar zijn.
  test("een hoofdtaak met stappen vink je niet zelf af", async () => {
    const p = await addTask({ title: "p", horizon: "lang" });
    await addTask({ title: "s", parentId: p });
    await toggleDone(p);
    expect((await db.tasks.get(p)).doneAt).toBeNull();
  });

  test("de laatste stap afvinken maakt de hoofdtaak klaar", async () => {
    const p = await addTask({ title: "p", horizon: "lang" });
    const s1 = await addTask({ title: "s1", parentId: p });
    const s2 = await addTask({ title: "s2", parentId: p });
    await toggleDone(s1);
    expect((await db.tasks.get(p)).doneAt).toBeNull();
    await toggleDone(s2);
    expect((await db.tasks.get(p)).doneAt).toBeTruthy();
  });

  test("een stap terugzetten of erbij zetten maakt de hoofdtaak weer open", async () => {
    const p = await addTask({ title: "p", horizon: "lang" });
    const s = await addTask({ title: "s", parentId: p });
    await toggleDone(s);
    await toggleDone(s);
    expect((await db.tasks.get(p)).doneAt).toBeNull();
    await toggleDone(s);
    await addTask({ title: "s2", parentId: p });
    expect((await db.tasks.get(p)).doneAt).toBeNull();
  });

  test("de laatste open stap weghalen maakt de hoofdtaak klaar", async () => {
    const p = await addTask({ title: "p", horizon: "lang" });
    const s1 = await addTask({ title: "s1", parentId: p });
    const s2 = await addTask({ title: "s2", parentId: p });
    await toggleDone(s1);
    await deleteTask(s2);
    expect((await db.tasks.get(p)).doneAt).toBeTruthy();
  });

  test("een stap neemt de lijst van de hoofdtaak over", async () => {
    const p = await addTask({ title: "p", horizon: "lang" });
    const s = await addTask({ title: "s", parentId: p });
    expect((await db.tasks.get(s)).horizon).toBe("lang");
  });

  test("naar vandaag zet de datum op vandaag", async () => {
    const id = await addTask({ title: "x", date: "2026-11-01" });
    await moveToToday(id, "2026-11-24");
    expect((await db.tasks.get(id)).date).toBe("2026-11-24");
  });
});
