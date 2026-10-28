// Schrijft src/ui/glyphs.js: de paden van alle lijniconen die de app gebruikt.
// Basis is Phosphor (regular, MIT); een paar iconen die daar niet in zitten
// tekenen we zelf in dezelfde stijl (256-raster, lijndikte 16).
// Draai na het wijzigen van EMOJI_GLYPH of UI_GLYPHS: `npm run glyphs`.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { EMOJI_GLYPH } from "../src/lib/emojiGlyph.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const PHOSPHOR = join(root, "node_modules/@phosphor-icons/core/assets/regular");
const OUT = join(root, "src/ui/glyphs.js");

// Iconen die de UI zelf gebruikt via <Icon name="…">.
const UI_GLYPHS = [
  "check-circle",
  "calendar-blank",
  "notebook",
  "book-open-text",
  "dots-three",
  "chart-bar",
  "caret-left",
  "caret-right",
  "arrows-down-up",
  "check",
  "dots-six-vertical",
  "dots-three-vertical",
  "minus",
  "x",
  "arrow-u-up-right",
  "caret-down",
  "list-bullets",
  "list-numbers",
  "text-b",
  "text-italic",
  "text-indent",
  "text-outdent",
  "caret-line-down",
  "hash",
  "caret-up",
  "text-h",
];

const circle = (cx, cy, r) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;

const beads = Array.from({ length: 9 }, (_, i) => {
  const a = (Math.PI * (-140 + i * 35)) / 180;
  const x = Math.round(128 + 70 * Math.sin(a));
  const y = Math.round(100 - 70 * Math.cos(a));
  return circle(x, y, 18);
}).join("");

// d = gevuld pad, s = lijnpad (lijndikte 16, ronde uiteinden).
const CUSTOM = {
  tasbih: {
    d: beads,
    s: `${circle(128, 184, 14)}M118 198l-10 34M138 198l10 34M128 198v34`,
  },
  "prayer-mat": {
    s: "M74 28h108a14 14 0 0 1 14 14v172a14 14 0 0 1-14 14H74a14 14 0 0 1-14-14V42a14 14 0 0 1 14-14ZM96 140V100a32 32 0 0 1 64 0v40ZM60 176h136",
  },
  yaz: {
    s: "M128 32v192M128 104 64 48M128 104l64-56M128 152l-64 56M128 152l64 56",
  },
};

const names = [...new Set([...Object.keys(EMOJI_GLYPH), ...UI_GLYPHS])].sort();
const glyphs = {};
for (const name of names) {
  if (CUSTOM[name]) {
    glyphs[name] = CUSTOM[name];
    continue;
  }
  const svg = readFileSync(join(PHOSPHOR, `${name}.svg`), "utf8");
  const d = svg.match(/<path d="([^"]+)"\/>/)?.[1];
  if (!d) throw new Error(`Geen enkel pad in ${name}.svg`);
  glyphs[name] = { d };
}

writeFileSync(
  OUT,
  `// Gegenereerd door scripts/build-glyphs.mjs — niet met de hand bewerken.
// Iconen: Phosphor Icons (https://phosphoricons.com), MIT-licentie,
// Copyright (c) 2023 Phosphor Icons. Eigen: ${Object.keys(CUSTOM).join(", ")}.
export const GLYPHS = ${JSON.stringify(glyphs, null, 1)};
`,
);
console.log(`✓ Iconen: ${names.length} in src/ui/glyphs.js`);
