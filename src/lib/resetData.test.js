import { expect, test } from "vitest";
import { db } from "./db.js";
import { clearEverything } from "./resetData.js";

test("alles wissen haalt ook de taken weg", async () => {
  await db.tasks.put({ id: "t", title: "x" });
  await clearEverything();
  expect(await db.tasks.count()).toBe(0);
});
