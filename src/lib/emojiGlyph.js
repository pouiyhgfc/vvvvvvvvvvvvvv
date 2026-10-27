// Welk lijnicoon (src/ui/glyphs.js) hoort bij welk emoji. Je data bewaart nog
// steeds het emoji, het dataformaat blijft dus gelijk; alleen de weergave is
// een icoon. Vlaggen worden een lettertegel met de taal (🇸🇦 → ع, 🇫🇷 → Fr).
// Nieuw icoon: voeg het hier toe en draai `npm run glyphs`.
export const EMOJI_GLYPH = {
  // Geloof
  mosque: ["🕌"],
  "prayer-mat": ["🧎", "🛐"],
  "hands-praying": ["🤲", "🙏"],
  tasbih: ["📿"],
  "book-open-text": ["📜"],
  "book-bookmark": ["📖", "📔"],
  book: ["📕"],
  repeat: ["🔁"],
  "star-and-crescent": ["☪️"],
  "moon-stars": ["🕋", "🌛"],
  "sun-horizon": ["🌅", "🌄"],
  "hand-heart": ["🫶", "🤗"],
  yaz: ["ⵣ"],

  // Sport & lichaam
  "boxing-glove": ["🥊", "🤼", "🥋", "🤺"],
  barbell: ["🏋️", "💪"],
  "person-arms-spread": ["🤸"],
  "person-simple-run": ["🏃", "🎽"],
  "person-simple-walk": ["🚶"],
  "person-simple-hike": ["🧗"],
  "person-simple-tai-chi": ["🧘", "🧘‍♂️", "💆"],
  bicycle: ["🚴", "🚵"],
  "person-simple-swim": ["🏊", "🏊‍♂️"],
  "person-simple-ski": ["⛷️"],
  "sneaker-move": ["👟", "🛹"],
  "soccer-ball": ["⚽"],
  basketball: ["🏀", "⛹️"],
  volleyball: ["🏐", "🤾"],
  football: ["🏈"],
  baseball: ["⚾"],
  "tennis-ball": ["🎾", "🏸"],
  "ping-pong": ["🏓"],
  hockey: ["🏒"],
  heartbeat: ["🫀"],

  // Talen
  translate: ["🔤"],
  "text-aa": ["🔡"],
  cards: ["🃏"],
  "chat-circle": ["💬", "🗣️"],

  // Studie & werk
  "graduation-cap": ["🎓"],
  books: ["📚"],
  notebook: ["📓"],
  "note-pencil": ["📝"],
  note: ["🗒️"],
  "pencil-simple": ["✏️"],
  pen: ["🖊️"],
  "pen-nib": ["🖋️"],
  laptop: ["💻"],
  monitor: ["🖥️"],
  keyboard: ["⌨️"],
  "device-mobile": ["📱"],
  brain: ["🧠"],
  lightbulb: ["💡"],
  target: ["🎯"],
  microscope: ["🔬"],
  flask: ["🧪"],
  "chart-bar": ["📊"],
  "chart-line-up": ["📈"],
  calculator: ["🧮"],
  ruler: ["📐"],
  folders: ["🗂️"],
  "folder-open": ["📂"],
  archive: ["🗄️"],
  "file-text": ["📄"],
  "clipboard-text": ["📋"],
  "push-pin": ["📌"],
  "floppy-disk": ["💾"],
  broadcast: ["📡"],
  binoculars: ["🔭"],
  "lock-key": ["🔐"],
  lock: ["🔒"],
  key: ["🔑"],

  // Zelfzorg
  shower: ["🚿"],
  "hand-soap": ["🧴", "🧼"],
  bathtub: ["🛁", "🧖"],
  tooth: ["🦷", "🪥"],
  wind: ["🌬️", "🫁"],
  bed: ["🛌", "😴"],
  "flower-lotus": ["🌸"],
  pill: ["💊"],
  syringe: ["💉"],
  bandaids: ["🩹"],
  stethoscope: ["🩺"],
  thermometer: ["🌡️"],
  dna: ["🧬"],
  eye: ["👁️", "🧿"],
  broom: ["🧹"],

  // Eten & drinken
  "pint-glass": ["🥤", "🥛", "🧃"],
  coffee: ["☕"],
  "tea-bag": ["🍵", "🧉"],
  drop: ["💧"],
  "bowl-food": ["🥗"],
  "bowl-steam": ["🍜", "🍚"],
  "fork-knife": ["🍗", "🥩"],
  "cooking-pot": ["🍳"],
  egg: ["🥚"],
  bread: ["🌮"],
  pizza: ["🍕"],
  carrot: ["🥕", "🥦", "🍅"],
  avocado: ["🥑", "🫒"],
  "orange-slice": ["🍎", "🍓", "🫐", "🍌", "🍉", "🍇"],
  grains: ["🌾", "🥜"],
  jar: ["🍯", "🫙"],

  // Thuis, planning & overig
  house: ["🏠"],
  "shopping-cart": ["🛒"],
  "list-checks": ["☑️"],
  "check-circle": ["✅"],
  "x-circle": ["❌"],
  warning: ["⚠️"],
  bell: ["🔔"],
  alarm: ["⏰"],
  hourglass: ["⌛"],
  clock: ["🕰️"],
  calendar: ["📅"],
  "calendar-dots": ["🗓️"],
  "calendar-blank": ["📆"],
  "airplane-takeoff": ["✈️"],
  "map-pin": ["📍"],
  handshake: ["🤝"],
  "thumbs-up": ["👍"],
  trophy: ["🏆"],
  medal: ["🥇", "💯"],
  confetti: ["🎉", "🥳", "🎪"],
  robot: ["🤖"],
  gear: ["⚙️"],
  wrench: ["🛠️"],
  trash: ["🗑️"],
  "upload-simple": ["📤"],
  "download-simple": ["📥"],
  "arrows-clockwise": ["🔄"],
  "arrow-u-up-left": ["↩️"],
  plus: ["➕"],
  "magnifying-glass": ["🔍", "🧐"],
  tray: ["📭"],
  "shield-check": ["🛡️"],
  circle: ["🔴", "🟢"],

  // Media & creativiteit
  "film-slate": ["🎬"],
  "music-note": ["🎵"],
  "music-notes": ["🎶", "🎺", "🎻", "🥁"],
  guitar: ["🎸"],
  "piano-keys": ["🎹"],
  "microphone-stage": ["🎤"],
  microphone: ["🎙️"],
  "speaker-high": ["🔊"],
  headphones: ["🎧"],
  palette: ["🎨"],
  "paint-brush": ["🖌️"],
  camera: ["📷", "📸"],
  "game-controller": ["🎮", "🕹️"],
  "dice-five": ["🎲", "♟️"],
  "mask-happy": ["🎭"],

  // Natuur & gevoel
  sun: ["☀️"],
  "cloud-sun": ["🌤️"],
  cloud: ["☁️"],
  "cloud-rain": ["🌧️"],
  "cloud-lightning": ["⛈️"],
  lightning: ["⚡", "💥"],
  snowflake: ["❄️"],
  rainbow: ["🌈"],
  moon: ["🌙"],
  star: ["⭐", "🌟", "🤩"],
  "shooting-star": ["💫"],
  sparkle: ["✨"],
  fire: ["🔥", "🕯️"],
  waves: ["🌊"],
  leaf: ["🌿", "🍃"],
  plant: ["🌱", "🍄"],
  tree: ["🌳"],
  flower: ["🌻"],
  "flower-tulip": ["🌷"],
  butterfly: ["🦋"],
  mountains: ["🏔️", "🌋"],
  tent: ["🏕️"],
  "globe-hemisphere-east": ["🌍"],
  "globe-hemisphere-west": ["🌎"],
  heart: ["❤️", "💚", "🤍", "😍", "🥰"],
  smiley: ["😊", "😀", "😂", "😌", "🙂", "😎", "😏", "🫡"],
  "smiley-meh": ["😐", "😑", "🤨", "😒"],
  "smiley-sad": ["😞", "😔", "😢", "😭", "🥺"],
  "smiley-angry": ["😤", "😡"],
  "smiley-x-eyes": ["🤯"],
  "smiley-nervous": ["😱", "😰"],
  "smiley-melting": ["🫠"],
  "chat-teardrop-dots": ["🤔"],
};

// Vlag → taal op de lettertegel. Niet in de lijst: de landcode (🇳🇱 → Nl).
const FLAG_LETTERS = {
  SA: "ع",
  EG: "ع",
  PS: "ع",
  SY: "ع",
  IQ: "ع",
  LB: "ع",
  CN: "中",
  JP: "日",
  KR: "한",
  GB: "En",
  US: "En",
  AU: "En",
  CA: "En",
  ES: "Es",
  MX: "Es",
  AR: "Es",
  BR: "Pt",
  PT: "Pt",
};

// Variantselector (U+FE0F) weg, zodat "🏋" en "🏋️" hetzelfde icoon krijgen.
const bare = (s) => s.replace(/️/g, "");

const BY_EMOJI = new Map(
  Object.entries(EMOJI_GLYPH).flatMap(([name, list]) =>
    list.map((e) => [bare(e), name]),
  ),
);

const REGIONAL_A = 0x1f1e6;

function flagLetters(char) {
  const cps = [...char].map((c) => c.codePointAt(0) - REGIONAL_A);
  if (cps.length !== 2 || cps.some((n) => n < 0 || n > 25)) return null;
  const code = String.fromCharCode(65 + cps[0], 65 + cps[1]);
  return FLAG_LETTERS[code] ?? code[0] + code[1].toLowerCase();
}

// { name } voor een icoon, { letters } voor een vlag, of null als we het
// emoji niet kennen (dan toont <Emoji> de oude Twemoji-afbeelding).
export function glyphForEmoji(char) {
  const name = BY_EMOJI.get(bare(char));
  if (name) return { name };
  const letters = flagLetters(char);
  return letters ? { letters } : null;
}
