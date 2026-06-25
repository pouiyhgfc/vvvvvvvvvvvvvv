import { DAYS_NL, MONTHS_NL } from "./constants.js";

export function dk(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function fmtDate(d) {
  return `${DAYS_NL[d.getDay()]} ${d.getDate()} ${MONTHS_NL[d.getMonth()]} ${d.getFullYear()}`;
}
export function isToday(d) {
  const t = new Date();
  return (
    d.getDate() === t.getDate() &&
    d.getMonth() === t.getMonth() &&
    d.getFullYear() === t.getFullYear()
  );
}
export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
export function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function eventsOnDate(events, d) {
  const ds = dk(d),
    wd = d.getDay(),
    out = [];
  events.forEach((e) => {
    const rep = e.repeat || "none";
    if (rep === "none") {
      if (e.date === ds) out.push(e);
      return;
    }
    if (ds < e.date) return;
    if (e.exDates && e.exDates.includes(ds)) return;
    if (rep === "daily") {
      out.push({ ...e, date: ds, _recur: true });
      return;
    }
    if (rep === "weekly") {
      const ed = new Date(e.date + "T00:00");
      if (ed.getDay() === wd) out.push({ ...e, date: ds, _recur: true });
    }
  });
  return out;
}

// Template events keep their original `repeat` field, so recurring events
// stay recurring after loading. Use dayOffset (0-6) to shift dates to the
// target week. Each loaded event gets a fresh id to avoid collisions.
export function applyWeekTemplate(tpl, targetMonday) {
  return tpl.events.map((ev) => {
    const d = new Date(targetMonday);
    d.setDate(
      targetMonday.getDate() + Math.max(0, Math.min(6, ev.dayOffset || 0)),
    );
    return { ...ev, id: uid(), date: dk(d) };
  });
}

export function tMin(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
export function minT(m) {
  let mm = Math.max(0, Math.min(1439, Math.round(m)));
  return `${String(Math.floor(mm / 60)).padStart(2, "0")}:${String(mm % 60).padStart(2, "0")}`;
}
