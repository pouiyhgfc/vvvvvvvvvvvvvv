import { addDays } from "./date.js";

// Revisie volgens de traditionele indeling (zie .md/HIFD-ONDERZOEK.md):
// - sabqi: in de laatste 30 dagen gememoriseerd, of in de laatste 7 dagen
//   als "zwak" beoordeeld → elke dag;
// - manzil: al het andere gememoriseerde in vaste rotatie, langst niet
//   herhaald eerst, binnen het dagbudget.
// Draait voorlopig in schaduwmodus: het SRS-schema blijft leidend.
const SABQI_DAYS = 30;
const WEAK_DAYS = 7;

export function manzilPlan(records, logs, today, budget) {
  const memorized = records.filter((r) => r.status === "memorized");
  const weak = new Set(
    logs
      .filter(
        (l) =>
          l.phase === "review" &&
          l.rating === "zwak" &&
          l.date > addDays(today, -WEAK_DAYS),
      )
      .map((l) => l.surah),
  );
  const isSabqi = (r) =>
    (r.dateMemorized && r.dateMemorized > addDays(today, -SABQI_DAYS)) ||
    weak.has(r.surah);
  const doneToday = (r) => r.lastReviewed === today;

  const sabqi = memorized.filter(isSabqi);
  const manzil = memorized
    .filter((r) => !isSabqi(r))
    .sort(
      (a, b) =>
        (a.lastReviewed || "").localeCompare(b.lastReviewed || "") ||
        a.surah - b.surah,
    );
  // Sabqi gaat altijd voor; manzil krijgt wat er van het budget over is,
  // maar minstens één per dag zodat de rotatie nooit stilvalt.
  const manzilPerDay = Math.max(1, budget - sabqi.length);
  const manzilDone = manzil.filter(doneToday).length;

  return {
    sabqiToday: sabqi.filter((r) => !doneToday(r)),
    manzilToday: manzil
      .filter((r) => !doneToday(r))
      .slice(0, Math.max(0, manzilPerDay - manzilDone)),
    sabqiCount: sabqi.length,
    manzilCount: manzil.length,
    cycleDays: Math.ceil(manzil.length / manzilPerDay),
  };
}
