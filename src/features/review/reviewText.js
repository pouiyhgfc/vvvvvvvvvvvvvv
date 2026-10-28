import { DAYS_NL, MONTHS_NL } from "../../lib/constants.js";
import { addDays, dk, eventsOnDate, getMonday } from "../../lib/date.js";
import { TOTAL_AYAT } from "../../lib/surahs.js";

// Standaardopdracht voor de weekreview (muhasaba). Bewust direct: geen
// complimenten, wel eerlijke patronen en één concrete verbetering.
export const DEFAULT_PROMPT = `Dit is mijn muhasaba over de periode hieronder. Wees direct en eerlijk, geen complimenten of geruststelling.

1. Wat ging goed, en waarom (patronen, geen losse dagen)?
2. Waar schoot ik tekort? Benoem het concreet.
3. Wat zegt dit over mijn prioriteiten en mijn niyyah?
4. Geef één concrete verbetering voor de komende week, klein genoeg om echt te doen.`;

export const PERIODS = [
  ["week", "Deze week"],
  ["vorige", "Vorige week"],
  ["30", "30 dagen"],
];

const short = (key) => {
  const d = new Date(key + "T12:00");
  return `${DAYS_NL[d.getDay()].slice(0, 2).toLowerCase()} ${d.getDate()} ${MONTHS_NL[d.getMonth()].slice(0, 3).toLowerCase()}`;
};

// Van/tot (datumsleutels) en een leesbaar label voor de gekozen periode.
export function periodRange(kind, now = new Date()) {
  const today = dk(now);
  if (kind === "30") {
    const from = addDays(today, -29);
    return { from, to: today, label: `${short(from)} – ${short(today)}` };
  }
  const mon = dk(getMonday(now));
  const from = kind === "vorige" ? addDays(mon, -7) : mon;
  const to = addDays(from, 6);
  return { from, to, label: `${short(from)} – ${short(to)}` };
}

const keysBetween = (from, to) => {
  const out = [];
  for (let k = from; k <= to; k = addDays(k, 1)) out.push(k);
  return out;
};

function routineSection(routines, days, keys) {
  const all = Object.values(routines).flat();
  if (!all.length) return "";
  const lines = keys.map((k) => {
    const d = days[k];
    const done = all.filter((r) => d?.checked?.[r.id]).length;
    const extra = [
      d?.mood && `stemming ${d.mood}`,
      d?.energy && `energie ${d.energy}`,
    ]
      .filter(Boolean)
      .join(", ");
    return `- ${short(k)}: ${done}/${all.length}${extra ? ` (${extra})` : ""}`;
  });
  const perRoutine = all
    .map((r) => ({
      name: r.name,
      n: keys.filter((k) => days[k]?.checked?.[r.id]).length,
    }))
    .sort((a, b) => a.n - b.n);
  const fmt = (list) =>
    list.map((r) => `${r.name} (${r.n}/${keys.length})`).join(", ");
  return [
    "## Routines per dag",
    ...lines,
    "",
    `Minst gedaan: ${fmt(perRoutine.slice(0, 5))}`,
    `Meest gedaan: ${fmt(perRoutine.slice(-5).reverse())}`,
  ].join("\n");
}

function planningSection(events, keys) {
  const lines = keys.flatMap((k) =>
    eventsOnDate(events, new Date(k + "T12:00"))
      .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""))
      .map((e) => `- ${short(k)} ${e.startTime}–${e.endTime} ${e.title}`),
  );
  return lines.length ? ["## Planning", ...lines].join("\n") : "";
}

const MAX_NOTE = 1500;
function notesSection(notes, notebookName, from, to) {
  const inRange = notes.filter((n) => {
    const d = (n.updatedAt || n.date || "").slice(0, 10);
    return d >= from && d <= to;
  });
  if (!inRange.length) return "";
  const parts = inRange.map((n) => {
    const body = (n.body || "").trim();
    const cut = body.length > MAX_NOTE ? body.slice(0, MAX_NOTE) + " …" : body;
    return `### ${n.title || "Zonder titel"} (${notebookName(n)}, ${short((n.updatedAt || n.date).slice(0, 10))})\n${cut}`;
  });
  return ["## Notities", ...parts].join("\n\n");
}

function hifdSection(hifd, hifdLog, from, to) {
  const verses = hifd.reduce((s, r) => s + (r.versesKnown ?? 0), 0);
  const memorized = hifd.filter((r) => r.status === "memorized").length;
  const sessions = hifdLog.filter((l) => l.date >= from && l.date <= to);
  const count = (rating) => sessions.filter((l) => l.rating === rating).length;
  return [
    "## Hifd",
    `- Gekend: ${verses} van ${TOTAL_AYAT} verzen; ${memorized} surahs gememoriseerd`,
    `- Sessies in deze periode: ${sessions.length} (goed ${count("goed")}, redelijk ${count("redelijk")}, zwak ${count("zwak")})`,
  ].join("\n");
}

// De tekst die naar Claude gaat: opdracht + alleen de aangevinkte onderdelen.
export function buildReview({ prompt, range, include, data }) {
  const keys = keysBetween(range.from, range.to);
  const sections = [
    `# Weekreview ${range.label}`,
    prompt.trim(),
    include.routines && routineSection(data.routines, data.days, keys),
    include.planning && planningSection(data.events, keys),
    include.notes &&
      notesSection(data.notes, data.notebookName, range.from, range.to),
    include.hifd && hifdSection(data.hifd, data.hifdLog, range.from, range.to),
  ];
  return sections.filter(Boolean).join("\n\n");
}
