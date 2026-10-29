// Controleert een backup-bestand vóórdat de import iets overschrijft.
// Geeft een lijst met problemen terug (leeg = in orde). Bewust een eigen,
// kleine check i.p.v. een schema-library: alleen vorm en verplichte sleutels,
// zodat oude backups (die velden missen) gewoon blijven werken.

import { PERIOD_LABELS } from "./constants.js";

export const BACKUP_VERSION = 11;

// De tracker rendert elk dagdeel; ontbreekt er één, dan crasht de app.
const PERIODS = Object.keys(PERIOD_LABELS);

const isObject = (v) =>
  v !== null && typeof v === "object" && !Array.isArray(v);
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

// Per lijst: welk veld elk item minimaal moet hebben. `null` = alleen een
// object vereist; "any" = alles mag (oude versies bewaarden gebieden mogelijk
// als losse tekst).
const LISTS = {
  areas: "any",
  calTemplates: null,
  weekScheduleTemplates: null,
  entryTemplates: null,
  calEvents: (e) => typeof e.id === "string" && typeof e.date === "string",
  logEntries: (e) => typeof e.id === "string",
  notebooks: (n) => typeof n.id === "string",
  hifd: (r) => Number.isInteger(r.surah) && r.surah >= 1 && r.surah <= 114,
  hifdLog: (r) => Number.isInteger(r.surah) && typeof r.date === "string",
  files: (f) => typeof f.id === "string" && typeof f.data === "string",
};

export function validateBackup(data) {
  if (!isObject(data)) return ["Dit is geen backup-bestand."];
  const problems = [];

  if (typeof data.version === "number" && data.version > BACKUP_VERSION)
    problems.push(
      `Gemaakt met een nieuwere versie van de app (v${data.version}); werk de app eerst bij.`,
    );

  if ("routines" in data) {
    const ok =
      isObject(data.routines) &&
      PERIODS.every((p) => Array.isArray(data.routines[p]));
    if (!ok)
      problems.push(
        `Routines missen een dagdeel (nodig: ${PERIODS.join(", ")}).`,
      );
  }

  if ("settings" in data && !isObject(data.settings))
    problems.push("Instellingen hebben een onbekend formaat.");

  if ("days" in data) {
    const ok =
      isObject(data.days) &&
      Object.entries(data.days).every(
        ([key, day]) => DATE_KEY.test(key) && isObject(day),
      );
    if (!ok) problems.push("Dagdata heeft een onbekend formaat.");
  }

  for (const [name, itemOk] of Object.entries(LISTS)) {
    if (!(name in data)) continue;
    const list = data[name];
    if (!Array.isArray(list)) {
      problems.push(`"${name}" is geen lijst.`);
      continue;
    }
    if (itemOk === "any") continue;
    const bad = list.filter(
      (item) => !isObject(item) || (itemOk && !itemOk(item)),
    );
    if (bad.length)
      problems.push(`${bad.length} ongeldige item(s) in "${name}".`);
  }

  return problems;
}
