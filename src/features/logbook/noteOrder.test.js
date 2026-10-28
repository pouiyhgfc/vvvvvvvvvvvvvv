import { describe, expect, test } from "vitest";
import { orderKey, reorderWithinFull, sortNotes } from "./noteOrder.js";

const n = (id, extra = {}) => ({ id, date: "2026-10-01", ...extra });
const ids = (list) => list.map((e) => e.id);

describe("noteOrder", () => {
  test("eigen volgorde: zonder order eerst (nieuwste eerst), dan op order", () => {
    const list = [
      n("b", { order: 1 }),
      n("oud", { createdAt: "2026-10-01T08:00:00Z" }),
      n("a", { order: 0 }),
      n("nieuw", { createdAt: "2026-10-02T08:00:00Z" }),
    ];
    expect(ids(sortNotes(list, "eigen"))).toEqual(["nieuw", "oud", "a", "b"]);
    expect(orderKey(n("x", { order: 3 }))).toBe(3);
  });

  test("vastgezet staat altijd bovenaan, ook op datum", () => {
    const list = [
      n("nieuw", { updatedAt: "2026-10-05T00:00:00Z" }),
      n("vast", { updatedAt: "2026-09-01T00:00:00Z", pinnedAt: "x" }),
      n("ouder", { updatedAt: "2026-10-03T00:00:00Z" }),
    ];
    expect(ids(sortNotes(list, "datum"))).toEqual(["vast", "nieuw", "ouder"]);
  });

  test("slepen in een gefilterde lijst laat onzichtbare notities op hun plek", () => {
    const full = ["a", "x", "b", "y", "c"].map((id) => n(id));
    const visible = full.filter((e) => ["a", "b", "c"].includes(e.id));
    // c naar boven: komt vóór a, x en y blijven waar ze waren.
    expect(ids(reorderWithinFull(full, visible, 2, 0))).toEqual([
      "c",
      "a",
      "x",
      "b",
      "y",
    ]);
  });
});
