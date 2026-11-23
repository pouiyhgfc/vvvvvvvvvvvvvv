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

  test("een stap terugzetten laat de gedane hoofdtaak gedaan", async () => {
    const p = await addTask({ title: "p", horizon: "lang" });
    const s = await addTask({ title: "s", parentId: p });
    await toggleDone(s);
    await toggleDone(p);
    await toggleDone(s);
    expect((await db.tasks.get(s)).doneAt).toBeNull();
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
