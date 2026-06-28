// Spaced repetition voor gememoriseerde surahs (status "memorized").
// Variant op SM-2 (SuperMemo 2): elke surah heeft een eigen ease factor die
// bepaalt hoe snel het interval groeit. Aangepast voor Hifd: het interval wordt
// afgekapt op MAX_INTERVAL omdat gememoriseerde Koran snel wegzakt en dus
// minstens maandelijks aangeraakt moet worden.

export const INITIAL_EASE = 2.5; // SM-2 startwaarde
const MIN_EASE = 1.3; // onder deze waarde worden intervallen onpraktisch kort
const MAX_INTERVAL = 30; // cap in dagen (Hifd-specifiek)

// Oude vaste reeks — alleen nog gebruikt om bestaande data te migreren.
export const LEGACY_INTERVALS = [1, 3, 7, 14, 30];

// Berekent de nieuwe SRS-staat voor een kaart na een beoordeling.
// `card` heeft: easeFactor, interval (dagen), reps, lapses.
// Pure functie — geen side effects, zodat ze ook voor de knop-preview dient.
export function nextSrs(card, rating) {
  let ease = card.easeFactor ?? INITIAL_EASE;
  let interval = card.interval ?? 0;
  let reps = card.reps ?? 0;
  let lapses = card.lapses ?? 0;

  if (rating === "zwak") {
    // Teruggevallen: opnieuw vanaf 1 dag, ease omlaag.
    reps = 0;
    interval = 1;
    ease = Math.max(MIN_EASE, ease - 0.2);
    lapses += 1;
  } else {
    reps += 1;
    if (reps === 1) {
      interval = 1;
    } else if (reps === 2) {
      interval = 3;
    } else {
      const mult =
        rating === "redelijk" ? 1.2 : rating === "sterk" ? ease * 1.3 : ease; // "goed"
      interval = Math.round(interval * mult);
    }
    if (rating === "redelijk") ease = Math.max(MIN_EASE, ease - 0.15);
    if (rating === "sterk") ease = ease + 0.1;
    // "goed": ease ongewijzigd (zoals SM-2 bij quality 4)
  }

  interval = Math.min(Math.max(1, interval), MAX_INTERVAL);
  return { easeFactor: ease, interval, reps, lapses };
}
