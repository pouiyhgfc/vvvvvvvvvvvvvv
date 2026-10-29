import { describe, expect, test } from "vitest";
import { addDays } from "./date.js";
import { hifdStats } from "./hifdStats.js";
import { manzilPlan } from "./manzil.js";

// Fixture naar een echte stand: 15 gememoriseerde surahs (100–114, Juz 'Amma
// van achteren), de rest aan het leren of nog niet begonnen, een paar met
// veel lapses. Dagbudget 3.
const today = "2026-10-29";
const records = Array.from({ length: 114 }, (_, i) => {
  const surah = i + 1;
  if (surah >= 100)
    return {
      surah,
      status: "memorized",
      versesKnown: 5,
      dateMemorized: surah >= 113 ? "2026-10-20" : "2026-05-01",
      lastReviewed: addDays(today, -((surah - 100) % 7) - 1),
      lapses: surah === 101 ? 6 : 0,
      interval: 12,
      reps: 8,
      easeFactor: 2.3,
    };
  return { surah, status: surah >= 16 ? "learning" : "todo", versesKnown: 0 };
});
const logs = [
  {
    surah: 101,
    date: "2026-10-25",
    phase: "review",
    rating: "zwak",
    mistakes: "3+",
  },
  {
    surah: 101,
    date: "2026-10-27",
    phase: "review",
    rating: "redelijk",
    mistakes: "1-2",
  },
  {
    surah: 105,
    date: "2026-10-26",
    phase: "review",
    rating: "redelijk",
    mistakes: "0",
  },
  {
    surah: 107,
    date: "2026-10-26",
    phase: "review",
    rating: "goed",
    mistakes: "1-2",
  },
  { surah: 112, date: "2026-08-01", phase: "review", rating: "zwak" }, // te oud
  { surah: 20, date: "2026-10-28", phase: "learn", rating: "zwak" }, // leren telt niet
];

describe("Hifd met een echte stand", () => {
  test("manzil: recent en zwak dagelijks, de rest in rotatie, niets gaat terug", () => {
    const p = manzilPlan(records, logs, today, 3);
    // 113 en 114 recent gememoriseerd, 101 deze week zwak → sabqi.
    expect(p.sabqiCount).toBe(3);
    expect(p.manzilCount).toBe(12);
    // Budget 3 − 3 sabqi → toch minstens 1 manzil per dag.
    expect(p.manzilToday).toHaveLength(1);
    expect(p.cycleDays).toBe(12);
    // Lerende surahs komen niet in de revisie.
    const planned = [...p.sabqiToday, ...p.manzilToday];
    expect(planned.every((r) => r.status === "memorized")).toBe(true);
  });

  test("statistieken: dekking, revisies, cyclus en zwakke plekken", () => {
    const s = hifdStats(records, logs, today, 3);
    expect(s).toMatchObject({
      memorized: 15,
      reviews: 4,
      coveragePct: 100, // alles in de laatste 7 dagen herhaald
      cycleDays: 12,
    });
    expect(s.weakest).toEqual([
      { surah: 101, points: 6 },
      { surah: 105, points: 1 },
      { surah: 107, points: 1 },
    ]);
  });

  test("dekking telt wat lang niet herhaald is niet mee", () => {
    const stale = records.map((r) =>
      r.surah >= 110 ? { ...r, lastReviewed: "2026-08-01" } : r,
    );
    expect(hifdStats(stale, [], today, 3).coveragePct).toBe(67); // 10 van 15
  });

  test("zonder hifd geen deling door nul", () => {
    expect(hifdStats([], [], today, 3)).toMatchObject({
      memorized: 0,
      coveragePct: 0,
      weakest: [],
    });
  });
});
