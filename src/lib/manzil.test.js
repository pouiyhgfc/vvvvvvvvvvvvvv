import { describe, expect, test } from "vitest";
import { manzilPlan } from "./manzil.js";

const today = "2026-10-29";
const mem = (surah, dateMemorized, lastReviewed) => ({
  surah,
  status: "memorized",
  dateMemorized,
  lastReviewed,
});

describe("manzilPlan", () => {
  const records = [
    mem(114, "2026-10-20", "2026-10-28"), // recent → sabqi
    mem(113, "2026-06-01", "2026-10-01"), // oud, lang niet herhaald
    mem(112, "2026-06-01", "2026-10-20"),
    mem(111, "2026-06-01", "2026-10-25"),
    mem(110, "2026-06-01", "2026-10-29"), // vandaag al gedaan
    { surah: 1, status: "learning" },
  ];

  test("sabqi elke dag, manzil langst-niet-herhaald eerst binnen budget", () => {
    const p = manzilPlan(records, [], today, 3);
    expect(p.sabqiToday.map((r) => r.surah)).toEqual([114]);
    // Budget 3 − 1 sabqi = 2 manzil per dag; 110 telt al voor vandaag.
    expect(p.manzilToday.map((r) => r.surah)).toEqual([113]);
    expect(p).toMatchObject({ sabqiCount: 1, manzilCount: 4, cycleDays: 2 });
  });

  test("een zwakke revisie zet een oude surah een week in sabqi", () => {
    const logs = [
      { surah: 111, date: "2026-10-27", phase: "review", rating: "zwak" },
    ];
    const p = manzilPlan(records, logs, today, 3);
    expect(p.sabqiToday.map((r) => r.surah).sort()).toEqual([111, 114]);
    // Te oud (8 dagen) telt niet meer.
    const old = [
      { surah: 111, date: "2026-10-21", phase: "review", rating: "zwak" },
    ];
    expect(manzilPlan(records, old, today, 3).sabqiCount).toBe(1);
  });

  test("bij een vol budget nog altijd één manzil per dag", () => {
    const p = manzilPlan(records, [], today, 1);
    expect(p.manzilToday).toHaveLength(0); // 110 is vandaag al gedaan
    expect(p.cycleDays).toBe(4);
  });
});
