import { dk, eventsOnDate } from "./date.js";

// Herinneringen voor de Android-app: elk blok in de komende `days` dagen
// op starttijd min `lead` minuten. Android plant ze zelf in, dus ze komen
// ook als de app dicht is. Id = vaste hash van blok + dag, zodat opnieuw
// inplannen dezelfde melding vervangt in plaats van verdubbelt.
export function upcomingReminders(
  calEvents,
  lead,
  now = new Date(),
  days = 14,
) {
  const out = [];
  for (let i = 0; i < days; i++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    for (const ev of eventsOnDate(calEvents, day)) {
      const [h, m] = (ev.startTime || "00:00").split(":").map(Number);
      const at = new Date(
        day.getFullYear(),
        day.getMonth(),
        day.getDate(),
        h,
        m - lead,
      );
      if (at <= now) continue;
      out.push({
        id: hash(`${ev.id}|${dk(day)}`),
        at,
        title: `${ev.icon || "🔔"} ${ev.title}`,
        body: `${ev.startTime}–${ev.endTime}${ev.desc ? " · " + ev.desc : ""}`,
      });
    }
  }
  return out;
}

// Positief 31-bits getal (Android-meldingen willen een int als id).
function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return h & 0x7fffffff;
}
