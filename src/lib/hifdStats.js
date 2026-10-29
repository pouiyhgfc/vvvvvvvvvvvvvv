import { addDays } from "./date.js";
import { manzilPlan } from "./manzil.js";

const WINDOW = 30;
const RATING_WEIGHT = { zwak: 2, redelijk: 1 };
const MISTAKE_WEIGHT = { "3+": 2, "1-2": 1 };

// Hifd over de laatste 30 dagen, voor Statistieken (zie HIFD-ONDERZOEK §4):
// dekking (welk deel van je hifd herhaald is), aantal revisies, de
// manzil-cyclus en de zwakste surahs (beoordeling + fouten).
export function hifdStats(records, logs, today, budget) {
  const memorized = records.filter((r) => r.status === "memorized");
  const since = addDays(today, -WINDOW);
  const reviews = logs.filter((l) => l.phase === "review" && l.date > since);
  const seen = new Set(reviews.map((l) => l.surah));
  const covered = memorized.filter(
    (r) => seen.has(r.surah) || (r.lastReviewed && r.lastReviewed > since),
  ).length;

  const score = new Map();
  for (const l of reviews) {
    const s =
      (RATING_WEIGHT[l.rating] ?? 0) + (MISTAKE_WEIGHT[l.mistakes] ?? 0);
    if (s) score.set(l.surah, (score.get(l.surah) ?? 0) + s);
  }
  const weakest = [...score]
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, 3)
    .map(([surah, points]) => ({ surah, points }));

  return {
    memorized: memorized.length,
    reviews: reviews.length,
    coveragePct: memorized.length
      ? Math.round((covered / memorized.length) * 100)
      : 0,
    cycleDays: manzilPlan(records, logs, today, budget).cycleDays,
    weakest,
  };
}
