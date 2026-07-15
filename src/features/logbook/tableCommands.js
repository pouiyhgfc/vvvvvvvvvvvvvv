// Tabel-acties. BlockNote 0.51 heeft hiervoor geen nette publieke API en gebruikt
// intern prosemirror-tables direct — er is GEEN `@tiptap/extension-table`, dus
// `editor._tiptapEditor.commands.addRowAfter` bestaat niet (dat was een stille
// no-op). We dispatchen daarom de echte prosemirror-tables-commands op de
// onderliggende ProseMirror-view. prosemirror-tables is dezelfde (gehoiste)
// instantie die BlockNote gebruikt, dus de commands zien dezelfde tabel-selectie.
// Alles hier ingekapseld met guards, zodat een BlockNote-upgrade die dit private
// pad wijzigt maar één bestand raakt.
import {
  addRowBefore,
  addRowAfter,
  addColumnBefore,
  addColumnAfter,
  deleteRow,
  deleteColumn,
  deleteTable as pmDeleteTable,
  toggleHeaderRow,
} from "prosemirror-tables";

const COMMANDS = {
  addRowBefore,
  addRowAfter,
  addColumnBefore,
  addColumnAfter,
  deleteRow,
  deleteColumn,
  toggleHeaderRow,
};

function pmView(editor) {
  return editor?._tiptapEditor?.view ?? editor?.prosemirrorView ?? null;
}

// Voert een prosemirror-tables-command uit op de cursor in de tabel. De command
// is een (state, dispatch) => boolean; false = geen effect (bv. cursor niet in
// een cel), dat handelen we stil af.
function dispatch(editor, command) {
  const view = pmView(editor);
  if (!view || typeof command !== "function") return;
  command(view.state, view.dispatch);
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
  dispatch(editor, COMMANDS[cmd]);
}

export function deleteTable(editor) {
  dispatch(editor, pmDeleteTable);
}
