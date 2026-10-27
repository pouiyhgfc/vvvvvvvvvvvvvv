// Rekenregels voor de planning, los van de weergave (met unit-tests).
// Een "voorkomen" is wat eventsOnDate teruggeeft: bij een herhalend blok een
// kopie van de reeks met `date` = de getoonde dag en `_recur: true`.
import { addDays, tMin, minT, uid } from "../../lib/date.js";

export const isRecurring = (ev) => !!ev.repeat && ev.repeat !== "none";

// Duur in minuten; een eindtijd vóór de begintijd loopt door na middernacht.
export function durationMin(startTime, endTime) {
  const d = tMin(endTime) - tMin(startTime);
  return d > 0 ? d : d + 1440;
}

export const snap = (min, step = 15) => Math.round(min / step) * step;

// Kolom per blok zodat overlappende blokken naast elkaar staan.
// Geeft Map<id, { col, totalCols }>.
export function layoutOverlaps(events) {
  const sorted = [...events].sort(
    (a, b) => tMin(a.startTime) - tMin(b.startTime),
  );
  const colEnds = [];
  const placed = sorted.map((ev) => {
    const start = tMin(ev.startTime);
    const end = start + durationMin(ev.startTime, ev.endTime);
    let col = 0;
    while (col < colEnds.length && colEnds[col] > start) col++;
    colEnds[col] = end;
    return { ev, col, start, end };
  });
  const result = new Map();
  for (const item of placed) {
    let maxCol = item.col;
    for (const other of placed)
      if (other !== item && other.start < item.end && other.end > item.start)
        maxCol = Math.max(maxCol, other.col);
    result.set(item.ev.id, { col: item.col, totalCols: maxCol + 1 });
  }
  return result;
}

const daysBetween = (a, b) =>
  Math.round((new Date(b + "T12:00") - new Date(a + "T12:00")) / 86400000);

// Het opgeslagen record zonder weergave-velden.
const clean = ({ _recur: _r, ...rest }) => rest;

// Past `changes` toe op het voorkomen `occ`.
// - Eenmalig blok: gewoon bijwerken.
// - Herhalend, scope "one": deze dag uitzonderen in de reeks en een
//   eenmalige kopie met de wijzigingen toevoegen.
// - Herhalend, scope "all": de reeks bijwerken. Een andere dag verschuift de
//   startdatum van de reeks evenveel dagen, zodat eerdere weken blijven staan.
export function updateOccurrence(events, occ, changes, scope = "all") {
  if (!isRecurring(occ)) {
    return events.map((e) =>
      e.id === occ.id ? clean({ ...e, ...changes }) : e,
    );
  }
  if (scope === "one") {
    return [
      ...events.map((e) =>
        e.id === occ.id
          ? { ...e, exDates: [...(e.exDates || []), occ.date] }
          : e,
      ),
      clean({
        ...occ,
        ...changes,
        id: uid(),
        repeat: "none",
        exDates: [],
      }),
    ];
  }
  return events.map((e) => {
    if (e.id !== occ.id) return e;
    const shift = changes.date ? daysBetween(occ.date, changes.date) : 0;
    return clean({
      ...e,
      ...changes,
      date: addDays(e.date, shift),
    });
  });
}

// Verwijdert een voorkomen: alleen deze dag (uitzondering) of het hele blok.
export function deleteOccurrence(events, occ, scope = "all") {
  if (isRecurring(occ) && scope === "one")
    return events.map((e) =>
      e.id === occ.id ? { ...e, exDates: [...(e.exDates || []), occ.date] } : e,
    );
  return events.filter((e) => e.id !== occ.id);
}

// Nieuwe begin- en eindtijd na verslepen met `deltaMin` minuten, in stappen
// van 15 en binnen de dag. De duur blijft gelijk.
export function movedTimes(occ, deltaMin, dayStartMin = 0, dayEndMin = 1440) {
  const dur = durationMin(occ.startTime, occ.endTime);
  let start = tMin(occ.startTime) + snap(deltaMin);
  start = Math.max(dayStartMin, Math.min(dayEndMin - dur, start));
  return { startTime: minT(start), endTime: minT(start + dur) };
}

// Nieuwe eindtijd na het handvat onderaan: minimaal 15 minuten, uiterlijk
// het einde van de dag.
export function resizedEnd(occ, deltaMin, dayEndMin = 1440) {
  const start = tMin(occ.startTime);
  const dur = durationMin(occ.startTime, occ.endTime) + snap(deltaMin);
  return minT(Math.min(dayEndMin - 1, start + Math.max(15, dur)));
}
