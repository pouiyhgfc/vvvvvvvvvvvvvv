import { DEFAULT_PACK, DEFAULT_PACK_AREAS } from "./starterPacks.js";

// Standaard voor een nieuwe installatie = het basispakket (zie welkomstscherm).
export const DEFAULT_ROUTINES = DEFAULT_PACK;

export const DEFAULT_CAL_TEMPLATES = [
  { id: "ct1", title: "Werk of studie", icon: "📚", color: "#7c3aed" },
  { id: "ct2", title: "Sport", icon: "🚶", color: "#ea580c" },
  { id: "ct3", title: "Afspraak", icon: "🗓️", color: "#0891b2" },
];

export const DEFAULT_AREAS = DEFAULT_PACK_AREAS;

function areaStyleFromColor(c) {
  return { accent: c, border: c, text: c, bg: c + "1c", tag: c + "2b" };
}
export const FALLBACK_AREA_STYLE = {
  accent: "#9ca3af",
  border: "#9ca3af",
  text: "#9ca3af",
  bg: "#9ca3af1c",
  tag: "#9ca3af2b",
};
export function buildAreaStyles(areas) {
  const m = {};
  (areas || []).forEach((a) => {
    m[a.name] = areaStyleFromColor(a.color);
  });
  return m;
}

export const PERIOD_LABELS = {
  ochtend: "Ochtend",
  middag: "Middag",
  avond: "Avond",
};
export const MOODS = [
  { value: "Geweldig", emoji: "🔥" },
  { value: "Goed", emoji: "😊" },
  { value: "Oké", emoji: "😐" },
  { value: "Moe", emoji: "😴" },
  { value: "Slecht", emoji: "😞" },
];
export const DAYS_NL = [
  "Zondag",
  "Maandag",
  "Dinsdag",
  "Woensdag",
  "Donderdag",
  "Vrijdag",
  "Zaterdag",
];
export const MONTHS_NL = [
  "Januari",
  "Februari",
  "Maart",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Augustus",
  "September",
  "Oktober",
  "November",
  "December",
];
// Iconen in de icoonkiezer. Elk emoji wordt als lijnicoon getoond (zie
// lib/emojiGlyph.js); de kiezer slaat het emoji op, dus het dataformaat blijft
// gelijk. Elk icoon staat er maar één keer in.
export const ICON_CATEGORIES = [
  {
    name: "Geloof",
    kw: "gebed bidden quran koran hifd duah dua adhkar dhikr islam moskee tahajjud",
    emojis: [
      "🕌",
      "🧎",
      "🤲",
      "📿",
      "📜",
      "📖",
      "📕",
      "🔁",
      "☪️",
      "🕋",
      "🌅",
      "🫶",
    ],
  },
  {
    name: "Sport & lichaam",
    kw: "sport fitness boxen rekken hardlopen gym workout zwemmen fietsen voetbal calisthenics wandelen yoga",
    emojis: [
      "🥊",
      "🏋️",
      "🤸",
      "🏃",
      "🚶",
      "🧗",
      "🧘",
      "🚴",
      "🏊",
      "⛷️",
      "👟",
      "⚽",
      "🏀",
      "🏐",
      "🎾",
      "🏓",
      "🫀",
    ],
  },
  {
    name: "Talen",
    kw: "taal talen arabisch chinees berbers tarifit engels nederlands frans spaans duits turks japans koreaans vocab anki",
    emojis: [
      "🇸🇦",
      "🇨🇳",
      "ⵣ",
      "🇬🇧",
      "🇳🇱",
      "🇫🇷",
      "🇪🇸",
      "🇩🇪",
      "🇹🇷",
      "🇯🇵",
      "🇰🇷",
      "🔤",
      "🔡",
      "🃏",
      "💬",
    ],
  },
  {
    name: "Studie & werk",
    kw: "studie school werk leren huiswerk computer lezen schrijven focus doel examen",
    emojis: [
      "🎓",
      "📚",
      "📓",
      "📝",
      "✏️",
      "💻",
      "🖥️",
      "📱",
      "🧠",
      "💡",
      "🎯",
      "🔬",
      "🧪",
      "📊",
      "🧮",
      "📋",
      "📌",
      "⏰",
      "⌛",
    ],
  },
  {
    name: "Zelfzorg",
    kw: "zelfzorg douche slapen rust gezondheid ademhaling tanden medicijn schoonmaken",
    emojis: [
      "🚿",
      "🧴",
      "🛁",
      "🦷",
      "🌬️",
      "🛌",
      "🌙",
      "🌸",
      "💊",
      "🩺",
      "🌡️",
      "🧹",
      "👁️",
    ],
  },
  {
    name: "Eten & drinken",
    kw: "eten drinken shake water fruit koffie thee maaltijd groente koken",
    emojis: [
      "🥤",
      "☕",
      "🍵",
      "💧",
      "🥗",
      "🍜",
      "🍗",
      "🍳",
      "🥚",
      "🌮",
      "🍕",
      "🥕",
      "🥑",
      "🍎",
      "🌾",
      "🍯",
    ],
  },
  {
    name: "Thuis & planning",
    kw: "thuis planning boodschappen taak afspraak reis vlucht melding agenda overig",
    emojis: [
      "🏠",
      "🛒",
      "☑️",
      "✅",
      "🔔",
      "📅",
      "✈️",
      "📍",
      "🤝",
      "🏆",
      "🎉",
      "⚙️",
      "🛠️",
    ],
  },
  {
    name: "Media & hobby",
    kw: "video film muziek luisteren podcast gitaar piano kunst tekenen foto spel hobby",
    emojis: ["🎬", "🎵", "🎧", "🎙️", "🎸", "🎹", "🎤", "🎨", "📷", "🎮", "🎲"],
  },
  {
    name: "Natuur & gevoel",
    kw: "natuur weer zon maan vuur berg boom bloem gevoel stemming blij moe verdrietig",
    emojis: [
      "☀️",
      "🌤️",
      "☁️",
      "🌧️",
      "⚡",
      "❄️",
      "🌈",
      "⭐",
      "✨",
      "🔥",
      "🌊",
      "🌿",
      "🌱",
      "🌳",
      "🌻",
      "🦋",
      "🏔️",
      "🏕️",
      "🌍",
      "❤️",
      "😊",
      "😐",
      "😞",
      "😡",
      "🤔",
    ],
  },
];
// Tekst of icoon óp een datakleur (die zijn verzadigd genoeg voor wit).
export const ON_DATA_COLOR = "#ffffff";
export const EVENT_COLORS = [
  "#0e7a52",
  "#2563eb",
  "#7c3aed",
  "#dc2626",
  "#d97706",
  "#be185d",
  "#0891b2",
  "#65a30d",
];
export const CAL_START_H = 3;
export const CAL_END_H = 24;
export const DEFAULT_NOTEBOOKS = [
  { id: "logboek", name: "Logboek", icon: "📖", color: "#0e7a52" },
];

// Kort helpertje om de sjabloon-doc leesbaar te houden.
const p = (text, styles = {}) => ({
  type: "paragraph",
  content: text ? [{ type: "text", text, styles }] : [],
});
const numberedWithQuestion = (title, question) => ({
  type: "numberedListItem",
  content: [{ type: "text", text: title, styles: { bold: true } }],
  children: [p(question)],
});

// Sjabloon voor het dagelijkse logboek. Wordt ALLEEN ingeladen als je in de
// dagelijkse routine op "Nieuw logboek voor vandaag" drukt (TrackerView) —
// bewust NIET in de algemene "+ Nieuw"-kiezer van het logboek. Het is een
// BlockNote-document (blocks-JSON) zonder id's, dus elk nieuw entry krijgt
// verse id's; TrackerView maakt er per keer een diepe kopie van.
export const DAILY_LOG_TEMPLATE_DOC = [
  {
    type: "heading",
    props: { level: 2 },
    content: [{ type: "text", text: "Vandaag:", styles: {} }],
  },
  p(""),
  numberedWithQuestion(
    "De Feitelijke Observatie:",
    "Welke specifieke handeling is ongepland uitgevoerd, of welke vastgestelde routine is genegeerd?",
  ),
  numberedWithQuestion(
    "De Foutieve Logica (Het Excuus):",
    "Welke exacte gedachte, welk argument of welke mate van vermoeidheid werd op het moment van falen gebruikt om de afwijking te legitimeren?",
  ),
  numberedWithQuestion(
    "De Ontkrachting (De Vernietiging):",
    "Welke harde data en langetermijndoelstellingen bewijzen onomstotelijk dat het zojuist geformuleerde excuus ongeldig en destructief is?",
  ),
  numberedWithQuestion(
    "Het Preventie-Protocol (De 'Als-Dan' Regel):",
    "Wat is de gedetailleerde, fysieke actie die onmiddellijk wordt uitgevoerd zodra deze specifieke trigger of dit excuus zich in de toekomst opnieuw voordoet?",
  ),
];
// Korte variant (standaard voor nieuwe gebruikers; keuze in Meer → Weergave).
export const DAILY_SHORT_TEMPLATE_DOC = [
  {
    type: "heading",
    props: { level: 2 },
    content: [{ type: "text", text: "Vandaag:", styles: {} }],
  },
  p(""),
  numberedWithQuestion("Wat ging goed?", ""),
  numberedWithQuestion("Wat kan beter?", ""),
  numberedWithQuestion("Waar ben ik dankbaar voor?", ""),
];
export const DEFAULT_SETTINGS = {
  theme: "light",
  notifEnabled: false,
  notifLeadMin: 10,
  streakPct: 50,
  hifdDailyCap: 4,
};
