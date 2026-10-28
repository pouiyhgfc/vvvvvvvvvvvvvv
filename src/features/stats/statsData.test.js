import { describe, expect, test } from "vitest";
import { monthStats, streakDays, weekStats, yearStats } from "./statsData.js";

const day = (n) => ({
  checked: Object.fromEntries([...Array(n)].map((_, i) => [`r${i}`, true])),
});

describe("statsData", () => {
  // 4 routines; ma 26 t/m wo 28 okt 2026 gevuld.
  const allDays = {
    "2026-10-26": day(4),
    "2026-10-27": day(2),
    "2026-10-28": day(1),
  };
  const wed = new Date(2026, 9, 28, 12);

  test("week telt per dag en in totaal", () => {
    const w = weekStats(wed, allDays, 4);
    expect(w.days.map((d) => d.pct)).toEqual([100, 50, 25, 0, 0, 0, 0]);
    expect(w).toMatchObject({ done: 7, total: 28, pct: 25 });
  });

  test("reeks: vandaag telt alleen mee als die al gehaald is", () => {
    // Drempel = helft van 4 = 2: wo (1) niet, di (2) en ma (4) wel.
    expect(streakDays(allDays, 4, wed)).toBe(2);
    expect(streakDays({ ...allDays, "2026-10-28": day(3) }, 4, wed)).toBe(3);
  });

  test("maand begint op de juiste weekdag", () => {
    const m = monthStats(wed, allDays, 4);
    expect(m.fDow).toBe(3); // 1 oktober 2026 is een donderdag
    expect(m.days).toHaveLength(31);
    expect(m.days[25]).toEqual({ day: 26, pct: 100 });
  });

  test("jaar: actieve dagen, langste reeks en gemiddelde", () => {
    const y = yearStats(wed, allDays, 4);
    expect(y).toMatchObject({ activeDays: 3, longestStreak: 2 });
    expect(y.avgPct).toBe(58); // (100 + 50 + 25) / 3
    expect(y.monthBars[9].pct).toBe(Math.round((7 / (4 * 31)) * 100));
  });
});
