import { dk, getMonday } from "../../lib/date.js";
import { DAYS_NL } from "../../lib/constants.js";

// Aantal afgevinkte routines op een dag (0 als er niets is).
const doneCount = (day) =>
  day?.checked ? Object.values(day.checked).filter(Boolean).length : 0;

// Pure berekeningen voor Statistieken. `allDays`: datumsleutel → dag met
// `checked` (routine-id → true); `total`: aantal routines.

// Week van `date` (ma–zo): per dag het percentage, plus het weektotaal.
export function weekStats(date, allDays, total) {
  const mon = getMonday(date);
  const days = [];
  let weekDone = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    const data = allDays[dk(d)];
    const done = doneCount(data);
    days.push({
      d: DAYS_NL[d.getDay()].substring(0, 2),
      pct: total > 0 ? Math.round((done / total) * 100) : 0,
    });
    weekDone += done;
  }
  const weekTotal = total * 7;
  return {
    days,
    done: weekDone,
    total: weekTotal,
    pct: weekTotal > 0 ? Math.round((weekDone / weekTotal) * 100) : 0,
  };
}

// Per focusgebied het percentage afgevinkt in de week van `date`.
export function areaWeekStats(date, allDays, allR) {
  const mon = getMonday(date);
  const stats = {};
  allR.forEach((r) => {
    if (!stats[r.area]) stats[r.area] = { total: 0, done: 0 };
  });
  for (let i = 0; i < 7; i++) {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    const data = allDays[dk(d)];
    allR.forEach((r) => {
      if (!stats[r.area]) return;
      stats[r.area].total++;
      if (data?.checked?.[r.id]) stats[r.area].done++;
    });
  }
  return Object.entries(stats).map(([area, s]) => ({
    area,
    pct: s.total > 0 ? Math.round((s.done / s.total) * 100) : 0,
  }));
}

// Minimaal aantal afgevinkte routines voor een "voltooide" dag; `pct` is de
// streak-drempel uit Meer (standaard 50%).
const dayThreshold = (total, pct = 50) =>
  Math.max(1, Math.ceil(total * (pct / 100)));

// Dagen op rij (vandaag telt mee als die al gehaald is) met minstens de
// drempel afgevinkt.
export function streakDays(allDays, total, pct, now = new Date()) {
  const threshold = dayThreshold(total, pct);
  let s = 0;
  const d = new Date(now);
  const todayData = allDays[dk(d)];
  const todayDone = doneCount(todayData);
  if (todayDone >= threshold) s++;
  d.setDate(d.getDate() - 1);
  for (let i = 0; i < 365; i++) {
    const data = allDays[dk(d)];
    const done = doneCount(data);
    if (done < threshold) break;
    s++;
    d.setDate(d.getDate() - 1);
  }
  return s;
}

// Maand van `date`: per dag het percentage; `fDow` = lege vakjes vóór de 1e.
export function monthStats(date, allDays, total) {
  const y = date.getFullYear(),
    m = date.getMonth();
  const first = new Date(y, m, 1),
    last = new Date(y, m + 1, 0);
  const fDow = first.getDay() === 0 ? 6 : first.getDay() - 1;
  const days = [];
  for (let d = 1; d <= last.getDate(); d++) {
    const k = dk(new Date(y, m, d));
    const data = allDays[k];
    const done = doneCount(data);
    days.push({
      day: d,
      pct: total > 0 ? Math.round((done / total) * 100) : 0,
    });
  }
  return { y, m, fDow, days };
}

// Jaar van `date`: weken-raster, actieve dagen, langste reeks, gemiddelde en
// per maand het percentage.
export function yearStats(date, allDays, total, pct) {
  const y = date.getFullYear();
  const firstMon = getMonday(new Date(y, 0, 1));
  const weeks = [];
  const cur = new Date(firstMon);
  while (cur.getFullYear() <= y) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(cur);
      d.setDate(cur.getDate() + i);
      if (d.getFullYear() !== y) {
        week.push(null);
      } else {
        const data = allDays[dk(d)];
        const done = doneCount(data);
        week.push({
          date: d,
          pct: total > 0 ? Math.round((done / total) * 100) : 0,
        });
      }
    }
    weeks.push(week);
    cur.setDate(cur.getDate() + 7);
    if (cur.getFullYear() > y) break;
  }

  let activeDays = 0,
    longestStreak = 0,
    totalPct = 0,
    trackedCount = 0,
    curS = 0;
  const threshold = dayThreshold(total, pct);
  for (let m = 0; m < 12; m++) {
    for (let d = 1; d <= new Date(y, m + 1, 0).getDate(); d++) {
      const k = dk(new Date(y, m, d));
      const data = allDays[k];
      const done = doneCount(data);
      if (done > 0) {
        activeDays++;
        totalPct += total > 0 ? Math.round((done / total) * 100) : 0;
        trackedCount++;
      }
      if (done >= threshold) {
        curS++;
        longestStreak = Math.max(longestStreak, curS);
      } else {
        curS = 0;
      }
    }
  }
  const avgPct = trackedCount > 0 ? Math.round(totalPct / trackedCount) : 0;

  const monthBars = [];
  for (let m = 0; m < 12; m++) {
    let mDone = 0;
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const k = dk(new Date(y, m, d));
      const data = allDays[k];
      mDone += doneCount(data);
    }
    const mTotal = total * daysInMonth;
    monthBars.push({
      m,
      pct: mTotal > 0 ? Math.round((mDone / mTotal) * 100) : 0,
    });
  }

  return { weeks, activeDays, longestStreak, avgPct, monthBars };
}
