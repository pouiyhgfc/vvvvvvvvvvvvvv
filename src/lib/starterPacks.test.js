import { describe, expect, it } from "vitest";
import { buildStart } from "./starterPacks.js";

const names = (routines) =>
  Object.values(routines)
    .flat()
    .map((r) => r.name);

describe("buildStart", () => {
  it("voegt gekozen pakketten samen per dagdeel, met hun focusgebieden", () => {
    const { routines, areas } = buildStart({ basis: true, geloof: true });
    expect(names(routines)).toContain("Glas water");
    expect(names(routines)).toContain("Fajr");
    expect(routines.avond.map((r) => r.name)).toContain("Isha");
    expect(areas.map((a) => a.name).sort()).toEqual([
      "Geloof",
      "Gezondheid",
      "Leren",
      "Zelfzorg",
    ]);
    expect(areas.every((a) => /^#[0-9a-f]{6}$/.test(a.color))).toBe(true);
  });

  it("niets gekozen = leeg beginnen", () => {
    expect(buildStart({})).toEqual({
      routines: { ochtend: [], middag: [], avond: [] },
      areas: [],
    });
  });

  it("routine-id's zijn uniek", () => {
    const { routines } = buildStart({ basis: true, geloof: true, hifd: true });
    const ids = Object.values(routines)
      .flat()
      .map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
