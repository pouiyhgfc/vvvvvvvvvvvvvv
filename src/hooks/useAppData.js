import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../lib/db.js";
import {
  reportSaveError as report,
  updateBlob,
  updateCalEvents,
  updateSettings,
} from "../lib/dataWrites.js";
import {
  DEFAULT_AREAS,
  DEFAULT_CAL_TEMPLATES,
  DEFAULT_ROUTINES,
  DEFAULT_SETTINGS,
} from "../lib/constants.js";

// Alle app-brede data uit Dexie (live), met setters die dezelfde vorm
// hebben als React-setters (waarde of updater-functie).
export function useAppData() {
  // --- Dexie reactive queries ---
  const settingsRecord = useLiveQuery(() => db.settings.get("singleton"));
  const settings = settingsRecord ?? DEFAULT_SETTINGS;

  const areasBlob = useLiveQuery(() => db.blobs.get("areas"));
  const areas = areasBlob?.data ?? DEFAULT_AREAS;

  const routinesBlob = useLiveQuery(() => db.blobs.get("routines"));
  const routines = routinesBlob?.data ?? DEFAULT_ROUTINES;

  const calTemplatesBlob = useLiveQuery(() => db.blobs.get("calTemplates"));
  const calTemplates = calTemplatesBlob?.data ?? DEFAULT_CAL_TEMPLATES;

  const weekScheduleTemplatesBlob = useLiveQuery(() =>
    db.blobs.get("weekTemplates"),
  );
  const weekScheduleTemplates = weekScheduleTemplatesBlob?.data ?? [];

  const calEvents = useLiveQuery(() => db.calEvents.toArray()) ?? [];

  const allDaysRaw = useLiveQuery(() => db.days.toArray());
  const allDays = useMemo(() => {
    if (!allDaysRaw) return {};
    const m = {};
    allDaysRaw.forEach((e) => {
      m[e.date] = e;
    });
    return m;
  }, [allDaysRaw]);

  // --- Setters met dezelfde vorm als React-setters (waarde of updater).
  // De updater krijgt de verse stand uit Dexie, niet die van deze render.
  const setSettings = (updater) =>
    report(updateSettings(DEFAULT_SETTINGS, updater));
  const setAreas = (updater) =>
    report(updateBlob("areas", DEFAULT_AREAS, updater));
  const setRoutines = (updater) =>
    report(updateBlob("routines", DEFAULT_ROUTINES, updater));
  const setCalTemplates = (updater) =>
    report(updateBlob("calTemplates", DEFAULT_CAL_TEMPLATES, updater));
  const setWeekScheduleTemplates = (updater) =>
    report(updateBlob("weekTemplates", [], updater));
  const setCalEvents = (updater) => report(updateCalEvents(updater));

  return {
    settings,
    setSettings,
    areas,
    setAreas,
    routines,
    setRoutines,
    calTemplates,
    setCalTemplates,
    weekScheduleTemplates,
    setWeekScheduleTemplates,
    calEvents,
    setCalEvents,
    allDaysRaw,
    allDays,
  };
}
