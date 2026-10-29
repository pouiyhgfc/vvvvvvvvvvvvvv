// Vaste demodata voor de screenshot-tests, als volledige backup (formaat v9).
// Alle datums hangen aan TODAY, dezelfde datum die de tests als klok zetten.
import { DEFAULT_SETTINGS } from "../../src/lib/constants.js";
import { buildStart } from "../../src/lib/starterPacks.js";
import { SURAHS } from "../../src/lib/surahs.js";

const TODAY = "2026-10-27"; // dinsdag
export const NOW = new Date(`${TODAY}T09:30:00+08:00`);

const day = (offset) => {
  const d = new Date(`${TODAY}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
};

const text = (t, styles = {}) => [{ type: "text", text: t, styles }];
const para = (t) => ({ type: "paragraph", content: t ? text(t) : [] });

// Vaste demo-routines: alle startpakketten samen.
const { routines, areas } = buildStart({
  basis: true,
  geloof: true,
  hifd: true,
});
const routineIds = Object.values(routines)
  .flat()
  .map((r) => r.id);

// Een week met wisselende voortgang, zodat ringen, streak en heatmap iets tonen.
const days = {};
[0.35, 0.8, 0.6, 1, 0.45, 0.7, 0.9, 0.5].forEach((share, i) => {
  const checked = {};
  routineIds
    .slice(0, Math.round(routineIds.length * share))
    .forEach((id) => (checked[id] = true));
  days[day(-i)] = {
    checked,
    energy: 5 + (i % 4),
    mood: ["Goed", "Geweldig", "Oké", "Moe"][i % 4],
  };
});

const calEvents = [
  {
    id: "ev1",
    date: day(0),
    title: "Railroad Engineering",
    icon: "🚆",
    startTime: "09:10",
    endTime: "12:10",
    color: "#0e7a52",
    desc: "Civil Eng. 204",
    repeat: "weekly",
    exDates: [],
  },
  {
    id: "ev2",
    date: day(0),
    title: "Lunch",
    icon: "🍲",
    startTime: "12:30",
    endTime: "13:15",
    color: "#ca8a04",
    desc: "",
    repeat: "none",
  },
  {
    id: "ev3",
    date: day(-1),
    title: "Sport",
    icon: "🥊",
    startTime: "18:00",
    endTime: "19:00",
    color: "#ea580c",
    desc: "",
    repeat: "weekly",
    exDates: [],
  },
  {
    id: "ev4",
    date: day(1),
    title: "Psychologie",
    icon: "🧠",
    startTime: "14:20",
    endTime: "17:20",
    color: "#7c3aed",
    desc: "",
    repeat: "none",
  },
];

const logEntries = [
  {
    id: "le1",
    notebookId: "logboek",
    date: day(0),
    title: "Dinsdag",
    doc: [
      { type: "heading", props: { level: 2 }, content: text("Vandaag:") },
      para("Vroeg op, Fajr op tijd en daarna een uur Hifd gedaan."),
      {
        type: "bulletListItem",
        content: text("Railroad: dwarsliggers en ballast"),
      },
      {
        type: "bulletListItem",
        content: text("Arabisch: hoofdstuk 4 herhaald"),
      },
      {
        type: "checkListItem",
        props: { checked: true },
        content: text("Week plannen"),
      },
      {
        type: "checkListItem",
        props: { checked: false },
        content: text("Backup exporteren"),
      },
    ],
    body: "## Vandaag:\n\nVroeg op, Fajr op tijd en daarna een uur Hifd gedaan.\n\n* Railroad: dwarsliggers en ballast\n* Arabisch: hoofdstuk 4 herhaald\n* [x] Week plannen\n* [ ] Backup exporteren\n",
    tags: ["hifd", "studie"],
    mood: "Goed",
    createdAt: `${day(0)}T08:00:00.000Z`,
    updatedAt: `${day(0)}T08:30:00.000Z`,
    order: 0,
  },
  {
    id: "le2",
    notebookId: "logboek",
    date: day(-2),
    title: "Zondag",
    doc: [para("Rustige dag. Wandeling in Yangmingshan.")],
    body: "Rustige dag. Wandeling in Yangmingshan.\n",
    tags: ["wandelen"],
    mood: "Geweldig",
    createdAt: `${day(-2)}T20:00:00.000Z`,
    updatedAt: `${day(-2)}T12:00:00.000Z`, // 20:00 in Taiwan
    order: 1,
  },
  {
    id: "le3",
    notebookId: "studie",
    date: day(-1),
    title: "Spoorgeometrie",
    doc: [para("Boogstraal, verkanting en overgangsbogen samengevat.")],
    body: "Boogstraal, verkanting en overgangsbogen samengevat.\n",
    tags: ["rte"],
    mood: null,
    createdAt: `${day(-1)}T10:00:00.000Z`,
    updatedAt: `${day(-1)}T10:00:00.000Z`,
    order: 0,
  },
];

const memorized = { 1: -3, 112: -1, 113: 0, 114: 4, 108: 9, 103: 2 };
const learning = { 78: 12, 87: 5 };
const hifd = SURAHS.map((s) => {
  const base = {
    surah: s.id,
    versesKnown: 0,
    status: "todo",
    srsStep: 0,
    easeFactor: 2.5,
    interval: 0,
    reps: 0,
    nextDue: null,
    lastReviewed: null,
    lapses: 0,
    dateStarted: null,
    dateMemorized: null,
  };
  if (s.id in memorized)
    return {
      ...base,
      status: "memorized",
      versesKnown: s.verses,
      interval: 7,
      reps: 3,
      nextDue: day(memorized[s.id]),
      lastReviewed: day(memorized[s.id] - 7),
      dateStarted: day(-120),
      dateMemorized: day(-90),
    };
  if (s.id in learning)
    return {
      ...base,
      status: "learning",
      versesKnown: learning[s.id],
      dateStarted: day(-10),
    };
  return base;
});

const hifdLog = [
  { surah: 78, date: day(-1), phase: "learn", verses: 3 },
  { surah: 112, date: day(-8), phase: "review", rating: "goed" },
];

// Elke aanroep een eigen kopie: een test die de backup aanpast (bv. een
// notitie toevoegt) mag andere tests in dezelfde worker niet beïnvloeden.
export function demoBackup({ theme = "light" } = {}) {
  return structuredClone({
    version: 9,
    exportedAt: NOW.toISOString(),
    routines,
    areas,
    calTemplates: [],
    calEvents,
    weekScheduleTemplates: [],
    settings: { ...DEFAULT_SETTINGS, theme },
    days,
    logEntries,
    notebooks: [
      { id: "logboek", name: "Logboek", icon: "📖", color: "#0e7a52" },
      { id: "studie", name: "Studie", icon: "🎓", color: "#7c3aed" },
    ],
    entryTemplates: [],
    hifd,
    hifdLog,
  });
}
