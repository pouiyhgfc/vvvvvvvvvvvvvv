import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../lib/db.js";
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

  // --- Dexie-backed setters (same API as the old React setters) ---
  const setSettings = (updater) => {
    const current = settingsRecord ?? DEFAULT_SETTINGS;
    const next = typeof updater === "function" ? updater(current) : updater;
    db.settings.put({ id: "singleton", ...next });
  };

  const setAreas = (updater) => {
    const next = typeof updater === "function" ? updater(areas) : updater;
    db.blobs.put({ key: "areas", data: next });
  };

  const setRoutines = (updater) => {
    const next = typeof updater === "function" ? updater(routines) : updater;
    db.blobs.put({ key: "routines", data: next });
  };

  const setCalTemplates = (updater) => {
    const next =
      typeof updater === "function" ? updater(calTemplates) : updater;
    db.blobs.put({ key: "calTemplates", data: next });
  };

  const setWeekScheduleTemplates = (updater) => {
    const next =
      typeof updater === "function" ? updater(weekScheduleTemplates) : updater;
    db.blobs.put({ key: "weekTemplates", data: next });
  };

  const setCalEvents = (updater) => {
    const next = typeof updater === "function" ? updater(calEvents) : updater;
    db.transaction("rw", db.calEvents, async () => {
      await db.calEvents.clear();
      if (next.length) await db.calEvents.bulkPut(next);
    });
  };

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
