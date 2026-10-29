// Startpakketten voor een nieuwe gebruiker (welkomstscherm). Alles is daarna
// gewoon aan te passen in Meer → Routines en Focusgebieden.
const AREA_COLORS = {
  Gezondheid: "#ea580c",
  Zelfzorg: "#db2777",
  Leren: "#7c3aed",
  Geloof: "#0e7a52",
};

const r = (id, name, icon, area) => ({ id, name, icon, area });

const PACKS = {
  basis: {
    ochtend: [
      r("bas-water", "Glas water", "💧", "Gezondheid"),
      r("bas-bewegen", "Bewegen", "🚶", "Gezondheid"),
      r("bas-plannen", "Dag plannen", "🎯", "Zelfzorg"),
    ],
    middag: [
      r("bas-lezen", "Lezen", "📚", "Leren"),
      r("bas-eten", "Gezond eten", "🥗", "Gezondheid"),
    ],
    avond: [
      r("bas-logboek", "Logboek", "📓", "Zelfzorg"),
      r("bas-morgen", "Morgen voorbereiden", "🗓️", "Zelfzorg"),
      r("bas-slapen", "Op tijd slapen", "😴", "Zelfzorg"),
    ],
  },
  geloof: {
    ochtend: [
      r("gel-fajr", "Fajr", "🕌", "Geloof"),
      r("gel-adhkar-o", "Ochtend-adhkar", "📿", "Geloof"),
      r("gel-quran", "Quran lezen", "📜", "Geloof"),
    ],
    middag: [
      r("gel-dhuhr", "Dhuhr", "🕌", "Geloof"),
      r("gel-asr", "Asr", "🕌", "Geloof"),
    ],
    avond: [
      r("gel-maghrib", "Maghrib", "🕌", "Geloof"),
      r("gel-isha", "Isha", "🕌", "Geloof"),
      r("gel-adhkar-a", "Avond-adhkar", "📿", "Geloof"),
    ],
  },
  hifd: {
    ochtend: [r("hifd-sabaq", "Hifd", "📖", "Geloof")],
    middag: [],
    avond: [],
  },
};

export const DEFAULT_PACK = PACKS.basis;
export const DEFAULT_PACK_AREAS = areasFor(DEFAULT_PACK);

// Routines en focusgebieden voor de gekozen pakketten, bv.
// { basis: true, geloof: false, hifd: true }.
export function buildStart(choice) {
  const routines = { ochtend: [], middag: [], avond: [] };
  for (const key of Object.keys(PACKS)) {
    if (!choice[key]) continue;
    for (const period of Object.keys(routines))
      routines[period].push(...PACKS[key][period]);
  }
  return { routines, areas: areasFor(routines) };
}

function areasFor(routines) {
  const names = new Set(
    Object.values(routines)
      .flat()
      .map((x) => x.area),
  );
  return [...names].map((name) => ({ name, color: AREA_COLORS[name] }));
}
