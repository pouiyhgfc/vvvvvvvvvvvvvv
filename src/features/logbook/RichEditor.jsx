import { forwardRef, useImperativeHandle, useRef } from "react";
import {
  useCreateBlockNote,
  SuggestionMenuController,
  FormattingToolbar,
  FormattingToolbarController,
  getDefaultReactSlashMenuItems,
  getFormattingToolbarItems,
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import BlockHandle from "./BlockHandle.jsx";
import { filterSuggestionItems } from "@blocknote/core";
import { nl } from "@blocknote/core/locales";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import "./richEditor.css";

// Normaliseert initialContent naar BlockNote-blocks (of undefined voor leeg).
// Valt terug op string-conversie zodat oude platte-tekst entries niet crashen.
function toBlocks(raw) {
  if (Array.isArray(raw) && raw.length > 0) return raw;
  if (typeof raw === "string" && raw.trim()) {
    return raw.split("\n").map((line) => ({
      type: "paragraph",
      content: line ? [{ type: "text", text: line, styles: {} }] : [],
    }));
  }
  return undefined;
}

const EVERGREEN_TOKENS = {
  "--bn-colors-editor-background": "transparent",
  "--bn-colors-editor-text": "var(--text)",
  "--bn-colors-menu-text": "var(--text)",
  "--bn-colors-tooltip-text": "var(--text)",
  "--bn-colors-menu-background": "var(--card)",
  "--bn-colors-tooltip-background": "var(--card2)",
  "--bn-colors-hovered-background": "var(--border-soft)",
  "--bn-colors-selected-text": "var(--accent-contrast)",
  "--bn-colors-selected-background": "var(--accent)",
  "--bn-colors-disabled-text": "var(--text-faint)",
  "--bn-colors-border": "var(--border)",
  "--bn-colors-side-menu": "var(--text-faint)",
  "--bn-font-family": "var(--ff-body)",
};

// Strak & relevant: media-uploads (werken niet zonder backend) en de dubbele
// toggle-/subkoppen weggelaten. Keys zijn stabiel los van de NL-vertaling.
const SLASH_KEYS = new Set([
  "paragraph",
  "heading",
  "heading_2",
  "heading_3",
  "bullet_list",
  "numbered_list",
  "check_list",
  "quote",
  "code_block",
  "divider",
  "table",
  "emoji",
]);

// Gecureerde opmaak-toolbar: tekststijlen, uitlijning, kleur, inspringen, link.
// Comment-knoppen weg (geen backend); bestand-knoppen tonen toch alleen bij files.
const TOOLBAR_KEYS = new Set([
  "blockTypeSelect",
  "boldStyleButton",
  "italicStyleButton",
  "underlineStyleButton",
  "strikeStyleButton",
  "textAlignLeftButton",
  "textAlignCenterButton",
  "textAlignRightButton",
  "colorStyleButton",
  "nestBlockButton",
  "unnestBlockButton",
  "createLinkButton",
  "tableCellMergeButton",
]);

function CuratedToolbar() {
  return (
    <FormattingToolbar>
      {getFormattingToolbarItems().filter((item) => TOOLBAR_KEYS.has(item.key))}
    </FormattingToolbar>
  );
}

const RichEditor = forwardRef(function RichEditor(
  { initialContent, onChange, theme },
  ref,
) {
  const editor = useCreateBlockNote({
    initialContent: toBlocks(initialContent),
    // Eigen plaatshouder: de NL-default zegt alleen "typ '/'", maar getypte "/"
    // werkt niet op Android (IME-compositie) — daar is de +-knop de ingang.
    dictionary: {
      ...nl,
      placeholders: {
        ...nl.placeholders,
        default: "Voer tekst in — commando's via de +-knop of '/'",
      },
    },
    // Zet de geavanceerde tabel-features aan; zonder deze optie is de
    // merge-knop in de toolbar een dode knop.
    tables: {
      splitCells: true,
      cellBackgroundColor: true,
      cellTextColor: true,
      headers: true,
    },
  });

  useImperativeHandle(
    ref,
    () => ({
      getMarkdown: () => editor.blocksToMarkdownLossy(editor.document),
      undo: () => editor.undo(),
      redo: () => editor.redo(),
    }),
    [editor],
  );

  const containerRef = useRef(null);

  const getSlashItems = async (query) =>
    filterSuggestionItems(
      getDefaultReactSlashMenuItems(editor).filter((item) =>
        SLASH_KEYS.has(item.key),
      ),
      query,
    );

  return (
    <div className="bn-container" ref={containerRef}>
      <BlockNoteView
        editor={editor}
        theme={theme === "dark" ? "dark" : "light"}
        style={EVERGREEN_TOKENS}
        // Slash-menu, opmaak-toolbar én zijmenu vervangen door eigen touch-UI
        // (BlockHandle); het default-zijmenu is hover-gedreven en werkt niet op
        // touch. Link-toolbar, tabel-handvatten en emoji-picker blijven default.
        slashMenu={false}
        formattingToolbar={false}
        sideMenu={false}
        onChange={() => {
          // Eerst synchroon de doc + wijziging melden, zodat bij direct sluiten
          // (Terug-knop) de bewerking gegarandeerd is gemarkeerd. De markdown-
          // tekst is async en komt er daarna achteraan.
          const doc = editor.document;
          onChange({ doc });
          editor
            .blocksToMarkdownLossy(doc)
            .then((text) => onChange({ doc, text }));
        }}
      >
        <FormattingToolbarController formattingToolbar={CuratedToolbar} />
        <SuggestionMenuController
          triggerCharacter="/"
          getItems={getSlashItems}
        />
      </BlockNoteView>
      <BlockHandle editor={editor} containerRef={containerRef} />
    </div>
  );
});

export default RichEditor;
