import { beforeEach, expect, test } from "vitest";
import { db } from "./db.js";
import { toggleCheck, updateBlob, updateCalEvents } from "./dataWrites.js";

beforeEach(async () => {
  await db.delete();
  await db.open();
});

// Was een bug: elke wijziging ging uit van de stand bij de laatste render,
// dus twee snelle wijzigingen overschreven elkaar.
test("twee snelle wijzigingen in de planning blijven allebei staan", async () => {
  await db.calEvents.put({ id: "e0", date: "2026-11-24" });
  await Promise.all([
    updateCalEvents((prev) => [...prev, { id: "e1", date: "2026-11-24" }]),
    updateCalEvents((prev) => [...prev, { id: "e2", date: "2026-11-24" }]),
  ]);
  expect((await db.calEvents.toArray()).map((e) => e.id).sort()).toEqual([
    "e0",
    "e1",
    "e2",
  ]);
});

test("twee snelle wijzigingen in routines blijven allebei staan", async () => {
  await Promise.all([
    updateBlob("areas", [], (prev) => [...prev, { id: "a" }]),
    updateBlob("areas", [], (prev) => [...prev, { id: "b" }]),
  ]);
  expect((await db.blobs.get("areas")).data).toEqual([
    { id: "a" },
    { id: "b" },
  ]);
});

test("twee snelle vinkjes op een dag blijven allebei staan", async () => {
  await Promise.all([
    toggleCheck("2026-11-24", "r1"),
    toggleCheck("2026-11-24", "r2"),
  ]);
  const day = await db.days.get("2026-11-24");
  expect(day.checked).toEqual({ r1: true, r2: true });
  expect(day.date).toBe("2026-11-24");
});

test("een vinkje op een dag zonder checked-veld werkt", async () => {
  await db.days.put({ date: "2026-11-23", mood: "Goed" });
  await toggleCheck("2026-11-23", "r1");
  expect((await db.days.get("2026-11-23")).checked).toEqual({ r1: true });
});
