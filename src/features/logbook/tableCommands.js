// Tabel-acties. BlockNote 0.51 heeft hiervoor geen nette publieke API, dus we
// gaan via de onderliggende TipTap-commands. Alles zit hier ingekapseld met een
// guard, zodat een BlockNote-upgrade die het private pad wijzigt maar één
// bestand raakt in plaats van de hele UI.

function run(editor, cmd) {
  const commands = editor?._tiptapEditor?.commands;
  if (!commands || typeof commands[cmd] !== "function") return;
  commands[cmd]();
}

// Getoond in de blok-sheet zodra het actieve blok een tabel is.
export const TABLE_ACTIONS = [
  { label: "Rij boven invoegen", glyph: "R↑", cmd: "addRowBefore" },
  { label: "Rij onder invoegen", glyph: "R↓", cmd: "addRowAfter" },
  { label: "Kolom links invoegen", glyph: "K←", cmd: "addColumnBefore" },
  { label: "Kolom rechts invoegen", glyph: "K→", cmd: "addColumnAfter" },
  { label: "Rij wissen", glyph: "R✕", cmd: "deleteRow" },
  { label: "Kolom wissen", glyph: "K✕", cmd: "deleteColumn" },
  { label: "Kopregel aan/uit", glyph: "▤", cmd: "toggleHeaderRow" },
];

export function runTableCommand(editor, cmd) {
  run(editor, cmd);
}

export function deleteTable(editor) {
  run(editor, "deleteTable");
}
