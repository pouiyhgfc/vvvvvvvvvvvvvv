import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../lib/db.js";
import { EMPTY_DAY, reportSaveError, toggleCheck } from "../lib/dataWrites.js";
import { dk, isToday } from "../lib/date.js";
import { buzz } from "../lib/storage.js";
import { streakDays } from "../features/stats/statsData.js";

// De afgevinkte routines van één dag, met voortgang per dagdeel en de reeks.
export function useTrackerDay({ date, routines, allDays, streakPct }) {
  const [pop, setPop] = useState(null);
  const key = dk(date);
  const total = Object.values(routines).flat().length;
  const dayRecord = useLiveQuery(() => db.days.get(key), [key]);
  const day = dayRecord ?? EMPTY_DAY;

  const toggle = (id) => {
    reportSaveError(toggleCheck(key, id));
    if (!day.checked?.[id]) {
      buzz(8);
      setPop(id);
      setTimeout(() => setPop(null), 500);
    }
  };

  const checked = day.checked || {};
  const totalDone = Object.values(checked).filter(Boolean).length;
  const pctTotal = total > 0 ? Math.round((totalDone / total) * 100) : 0;
  const pDone = (p) => routines[p].filter((r) => checked[r.id]).length;
  const pPct = (p) =>
    routines[p].length > 0
      ? Math.round((pDone(p) / routines[p].length) * 100)
      : 0;

  // Reeks over de opgeslagen dagen; voor vandaag telt de huidige staat
  // (die kan een tel voorlopen op wat er al in Dexie staat).
  const streak = streakDays(
    isToday(date) ? { ...allDays, [dk(new Date())]: day } : allDays,
    total,
    streakPct || 50,
  );

  return { key, total, checked, pctTotal, pDone, pPct, streak, toggle, pop };
}
