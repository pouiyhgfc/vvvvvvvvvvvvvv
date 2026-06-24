import Dexie from 'dexie';
import { DEFAULT_ROUTINES, DEFAULT_AREAS, DEFAULT_CAL_TEMPLATES, DEFAULT_SETTINGS } from './constants.js';

export const db = new Dexie('routine-tracker');

db.version(1).stores({
  meta:      '&key',
  settings:  '&id',
  blobs:     '&key',       // slaat areas, routines, calTemplates, weekTemplates op als blob
  days:      '&date',      // sleutel = 'YYYY-MM-DD'
  calEvents: '&id, date',
});

export async function migrateFromLocalStorage() {
  const already = await db.meta.get('migrated');
  if (already) return;

  // settings
  const rawSettings = localStorage.getItem('rt_settings');
  await db.settings.put({
    id: 'singleton',
    ...DEFAULT_SETTINGS,
    ...(rawSettings ? JSON.parse(rawSettings) : {}),
  });

  // areas
  const rawAreas = localStorage.getItem('rt_areas');
  const parsedAreas = rawAreas ? JSON.parse(rawAreas) : null;
  await db.blobs.put({
    key: 'areas',
    data: Array.isArray(parsedAreas) && parsedAreas.length ? parsedAreas : DEFAULT_AREAS,
  });

  // routines
  const rawRoutines = localStorage.getItem('rt_routines');
  await db.blobs.put({
    key: 'routines',
    data: rawRoutines ? JSON.parse(rawRoutines) : DEFAULT_ROUTINES,
  });

  // calTemplates
  const rawCalTpls = localStorage.getItem('rt_cal_templates');
  await db.blobs.put({
    key: 'calTemplates',
    data: rawCalTpls ? JSON.parse(rawCalTpls) : DEFAULT_CAL_TEMPLATES,
  });

  // weekTemplates
  const rawWeekTpls = localStorage.getItem('rt_week_schedule_tpls');
  await db.blobs.put({
    key: 'weekTemplates',
    data: rawWeekTpls ? JSON.parse(rawWeekTpls) : [],
  });

  // calEvents (individuele records)
  const rawCalEvents = localStorage.getItem('rt_cal_events');
  const calEvents = rawCalEvents ? JSON.parse(rawCalEvents) : [];
  if (calEvents.length) await db.calEvents.bulkPut(calEvents);

  // days
  const dayEntries = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('rt_day_')) {
      try {
        const data = JSON.parse(localStorage.getItem(k) || '{}');
        dayEntries.push({ date: k.replace('rt_day_', ''), ...data });
      } catch {}
    }
  }
  if (dayEntries.length) await db.days.bulkPut(dayEntries);

  await db.meta.put({ key: 'migrated', value: true });
}
