// Kopieert alleen de gebruikte Twemoji-SVG's (+ custom glyphs) naar public/emoji/.
// public/emoji/ is gitignored en wordt door dev/build opnieuw gegenereerd.
import {
  existsSync,
  copyFileSync,
  mkdirSync,
  rmSync,
  readdirSync,
} from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { emojiCodepoint } from "../src/lib/emojiCodepoint.js";
import {
  EMOJI_CATEGORIES,
  DEFAULT_ROUTINES,
  DEFAULT_CAL_TEMPLATES,
  MOODS,
} from "../src/lib/constants.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const TWEMOJI = join(root, "node_modules", "@twemoji", "svg");
const CUSTOM = join(root, "src", "emoji-custom");
const OUT = join(root, "public", "emoji");

// Emoji die als label/icoon in de UI staan (knoppen, nav, koppen).
const UI_EMOJIS = [
  "📋","📝","📆","📅","📊","📖","⚙️","🔥","⚡","🗑️","✏️","📤","📥","💾",
  "🔄","➕","🔔","🌙","🌅","🌤️","🎨","🎯","⏰","💥","⚠️","📭","🔍","✅","🏆","📿","🤲","🔁","🌬️","🥤",
];

const chars = new Set(UI_EMOJIS);
for (const cat of EMOJI_CATEGORIES) for (const e of cat.emojis) chars.add(e);
for (const period of Object.values(DEFAULT_ROUTINES))
  for (const r of period) chars.add(r.icon);
for (const t of DEFAULT_CAL_TEMPLATES) chars.add(t.icon);
for (const m of MOODS) chars.add(m.emoji);

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

// Custom glyphs eerst (deze winnen van twemoji bij naam-conflict).
const customNames = new Set();
for (const f of readdirSync(CUSTOM)) {
  copyFileSync(join(CUSTOM, f), join(OUT, f));
  customNames.add(f);
}

let copied = customNames.size;
const missing = [];
for (const char of chars) {
  const file = `${emojiCodepoint(char)}.svg`;
  if (customNames.has(file)) continue;
  const src = join(TWEMOJI, file);
  if (existsSync(src)) {
    copyFileSync(src, join(OUT, file));
    copied++;
  } else {
    missing.push(`${char} (${file})`);
  }
}

console.log(`✓ Emoji: ${copied} SVG's in public/emoji/`);
if (missing.length) {
  console.log(`  Niet in Twemoji (ontbreekt): ${missing.join(", ")}`);
}
