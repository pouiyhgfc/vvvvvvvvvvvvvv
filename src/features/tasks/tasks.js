// Regels voor taken, los van de weergave (zie .md/ONTWERP-TAKEN.md). Datums
// zijn "YYYY-MM-DD"-strings, dus vergelijken kan gewoon als tekst.
import { addDays, minT, tMin } from "../../lib/date.js";

const DEFAULT_DURATION = 30;
const DEADLINE_SOON_DAYS = 3;

const isOpen = (t) => !t.doneAt;
const isMain = (t) => !t.parentId;
const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0);

// Een tijd hoort alleen bij een datum; met tijd standaard een half uur.
export function normalizeTask(fields) {
  const date = fields.date || null;
  const time = date ? fields.time || null : null;
  return {
    ...fields,
    title: fields.title.trim(),
    date,
    time,
    durationMin: time ? fields.durationMin || DEFAULT_DURATION : null,
  };
}

// Alleen wat je in de sheet kunt aanpassen: de rest (doneAt, volgorde) kan
// sinds het openen al veranderd zijn en mag niet terug naar die stand.
export const sheetFields = (f) => ({
  title: f.title,
  horizon: f.horizon,
  date: f.date || null,
  time: f.time || null,
  durationMin: Number(f.durationMin),
  deadline: f.deadline || null,
  remindDays: f.deadline && f.remindDays !== "" ? Number(f.remindDays) : null,
  note: f.note,
});

export const isOverdue = (t, today) =>
  isOpen(t) &&
  ((!!t.date && t.date < today) || (!!t.deadline && t.deadline < today));

// "naar vandaag" heeft alleen zin als de geplande datum voorbij is (te laat
// door een deadline los je zo niet op).
export const canMoveToToday = (t, today) =>
  isOpen(t) && !!t.date && t.date < today;

export function progress(steps) {
  if (!steps.length) return null;
  return Math.round(
    (steps.filter((s) => s.doneAt).length / steps.length) * 100,
  );
}

// Te laat eerst, dan op datum, dan zonder datum in eigen volgorde.
const byShort = (today) => (a, b) =>
  isOverdue(b, today) - isOverdue(a, today) ||
  (a.date ? 0 : 1) - (b.date ? 0 : 1) ||
  (a.date ?? "").localeCompare(b.date ?? "") ||
  byOrder(a, b);

export const shortList = (tasks, today) =>
  tasks
    .filter((t) => isMain(t) && isOpen(t) && t.horizon !== "lang")
    .sort(byShort(today));

export const longList = (tasks) =>
  tasks
    .filter((t) => isMain(t) && isOpen(t) && t.horizon === "lang")
    .sort(
      (a, b) =>
        (a.deadline ? 0 : 1) - (b.deadline ? 0 : 1) ||
        (a.deadline ?? "").localeCompare(b.deadline ?? "") ||
        byOrder(a, b),
    );

// Gedaan zonder datum: die staan niet in de planning, dus hier bewaard.
export const doneList = (tasks) =>
  tasks
    .filter((t) => isMain(t) && t.doneAt && !t.date)
    .sort((a, b) => b.doneAt.localeCompare(a.doneAt));

export const stepsOf = (tasks, id) =>
  tasks.filter((t) => t.parentId === id).sort(byOrder);

// Wat er op één dag in de planning staat; gedaan blijft zichtbaar.
export function onDate(tasks, day) {
  const planned = tasks.filter((t) => t.date === day);
  return {
    timed: planned.filter((t) => t.time),
    untimed: planned.filter((t) => !t.time),
    deadlines: tasks.filter((t) => isOpen(t) && t.deadline === day),
  };
}

// Het kaartje op Vandaag: de taken van de getoonde dag, en op vandaag ook
// wat te laat is en deadlines binnen drie dagen.
export function cardList(tasks, day, today) {
  const isToday = day === today;
  const items = tasks
    .filter(
      (t) => isOpen(t) && (t.date === day || (isToday && isOverdue(t, today))),
    )
    .sort(byShort(today));
  const soon = addDays(today, DEADLINE_SOON_DAYS);
  const deadlines = isToday
    ? tasks
        .filter(
          (t) =>
            isOpen(t) &&
            t.deadline &&
            t.deadline >= today &&
            t.deadline <= soon,
        )
        .sort((a, b) => a.deadline.localeCompare(b.deadline))
    : [];
  return { items, deadlines };
}

export const daysLeft = (deadline, today) =>
  Math.round(
    (new Date(deadline + "T12:00") - new Date(today + "T12:00")) / 86400000,
  );

// Eindtijd van een taak met tijd (blijft binnen de dag).
export const taskEnd = (t) =>
  minT(tMin(t.time) + (t.durationMin || DEFAULT_DURATION));

// Taken als events voor de meldingen (zelfde vorm als calEvents): een taak
// met tijd op zijn tijd, een deadline met herinnering om 09:00 zoveel dagen
// vooraf. Gedane taken melden niets. Alleen voor meldingen, niet voor Planning.
export function taskEvents(tasks) {
  const out = [];
  for (const t of tasks) {
    if (t.doneAt) continue;
    if (t.date && t.time)
      out.push({
        id: `task-${t.id}`,
        date: t.date,
        startTime: t.time,
        endTime: taskEnd(t),
        title: t.title,
      });
    if (t.deadline && t.remindDays != null)
      out.push({
        id: `deadline-${t.id}`,
        date: addDays(t.deadline, -t.remindDays),
        startTime: "09:00",
        endTime: "09:00",
        title: `Deadline: ${t.title}`,
      });
  }
  return out;
}
