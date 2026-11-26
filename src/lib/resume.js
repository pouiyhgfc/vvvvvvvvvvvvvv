import { loadJSON, saveJSON } from "./storage.js";

// Waar je was (scherm, notitieboek, open notitie). Android sluit een app op
// de achtergrond soms af; bij terugkomen binnen een uur ga je hier verder in
// plaats van opnieuw op Vandaag. Alleen weergave, geen data.
const KEY = "rt_resume";
const MAX_AGE = 60 * 60 * 1000;

export function loadResume() {
  const s = loadJSON(KEY, null);
  return s && Date.now() - s.at < MAX_AGE ? s : {};
}

export function rememberResume(patch) {
  saveJSON(KEY, { ...loadResume(), ...patch, at: Date.now() });
}

export function forgetResume() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Geen opslag: niets te vergeten.
  }
}

// Het uur telt vanaf het moment dat je wegging.
if (typeof document !== "undefined")
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") rememberResume({});
  });
