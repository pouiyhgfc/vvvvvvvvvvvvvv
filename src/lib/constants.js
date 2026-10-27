export const DEFAULT_ROUTINES = {
  ochtend: [
    { id: "o1", name: "Duah", icon: "🤲", area: "Quran/Hifd" },
    {
      id: "o2",
      name: "Rekken, Touwtje springen, Boxen",
      icon: "🥊",
      area: "Fitness",
    },
    { id: "o3", name: "Douchen", icon: "🚿", area: "Zelfzorg" },
    { id: "o4", name: "Bidden", icon: "🕌", area: "Quran/Hifd" },
    { id: "o5", name: "Hifd", icon: "📖", area: "Quran/Hifd" },
    { id: "o6", name: "Pagina Quran lezen", icon: "📜", area: "Quran/Hifd" },
    { id: "o7", name: "Ademhalingssessie", icon: "🌬️", area: "Zelfzorg" },
    { id: "o8", name: "Adhkar reciteren", icon: "📿", area: "Quran/Hifd" },
    { id: "o9", name: "Frans Anki", icon: "🇫🇷", area: "Talen" },
    { id: "o10", name: "Arabisch leren", icon: "🇸🇦", area: "Talen" },
    { id: "o11", name: "Chinees leren", icon: "🇨🇳", area: "Talen" },
    { id: "o12", name: "Berbers leren", icon: "ⵣ", area: "Talen" },
    { id: "o13", name: "Video kijken", icon: "🎬", area: "School" },
  ],
  middag: [
    { id: "m1", name: "Adhkar verrichten", icon: "📿", area: "Quran/Hifd" },
    { id: "m2", name: "Arabisch met AI", icon: "🇸🇦", area: "Talen" },
    { id: "m3", name: "Berbers met AI", icon: "ⵣ", area: "Talen" },
    { id: "m4", name: "Chinees met AI", icon: "🇨🇳", area: "Talen" },
    { id: "m5", name: "Hifd revisen/lezen", icon: "📖", area: "Quran/Hifd" },
  ],
  avond: [
    { id: "a1", name: "Shake maken", icon: "🥤", area: "Fitness" },
    { id: "a2", name: "Douche dingen", icon: "🚿", area: "Zelfzorg" },
    { id: "a3", name: "Rekken", icon: "🧘", area: "Fitness" },
    { id: "a4", name: "Blz Quran lezen", icon: "📜", area: "Quran/Hifd" },
    { id: "a5", name: "Ademhalingssessie", icon: "🌬️", area: "Zelfzorg" },
    { id: "a6", name: "Duah lezen", icon: "🤲", area: "Quran/Hifd" },
    { id: "a7", name: "Logboek", icon: "📓", area: "Zelfzorg" },
    { id: "a8", name: "Slapen (10-11 uur)", icon: "😴", area: "Zelfzorg" },
  ],
};

export const DEFAULT_CAL_TEMPLATES = [
  { id: "ct1", title: "Hifd", icon: "📖", color: "#dc2626" },
  { id: "ct2", title: "Rekken / Boxen", icon: "🥊", color: "#d97706" },
  { id: "ct3", title: "Arabisch", icon: "🇸🇦", color: "#7c3aed" },
  { id: "ct4", title: "Quran lezen", icon: "📜", color: "#0e7a52" },
  { id: "ct5", title: "Frans Anki", icon: "🇫🇷", color: "#2563eb" },
  { id: "ct6", title: "School", icon: "🎬", color: "#0891b2" },
];

export const DEFAULT_AREAS = [
  { name: "Quran/Hifd", color: "#dc2626" },
  { name: "Talen", color: "#7c3aed" },
  { name: "Fitness", color: "#ea580c" },
  { name: "Zelfzorg", color: "#db2777" },
  { name: "School", color: "#ca8a04" },
];

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

export const PERIOD_COLORS = {
  ochtend: "#d97706",
  middag: "#2563eb",
  avond: "#7c3aed",
};
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
export const WEEK_DAYS_SHORT = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];
export const CAL_HOUR_H = 56;
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
export const DEFAULT_SETTINGS = {
  theme: "light",
  notifEnabled: false,
  notifLeadMin: 10,
  streakPct: 50,
  hifdDailyCap: 4,
};
