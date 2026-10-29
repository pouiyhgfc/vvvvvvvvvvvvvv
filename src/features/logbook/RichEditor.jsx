import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
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
import KeyboardToolbar from "./KeyboardToolbar.jsx";
import { outdentEmptyListItem } from "./editorActions.js";
import {
  BlockNoteSchema,
  defaultBlockSpecs,
  defaultInlineContentSpecs,
  filterSuggestionItems,
  insertOrUpdateBlockForSlashMenu,
} from "@blocknote/core";
import { createCallout } from "./CalloutBlock.jsx";
import { createVideo } from "./VideoBlock.jsx";
import { noteLink, OpenNoteContext } from "./NoteLink.jsx";
import NoteLinkSheet from "./NoteLinkSheet.jsx";
import { resolveFileUrl, saveImage } from "../../lib/files.js";
import { sanitizeDoc } from "./docSchema.js";
import { fmtDate } from "../../lib/date.js";
import { db } from "../../lib/db.js";
import { isActive } from "../../lib/notes.js";
import Icon from "../../ui/Icon.jsx";
import { nl } from "@blocknote/core/locales";
import "@blocknote/mantine/style.css";
import "./richEditor.css";

// Standaardblokken plus onze eigen (callout, video, notitielink).
const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    callout: createCallout(),
    video: createVideo(),
  },
  inlineContentSpecs: { ...defaultInlineContentSpecs, noteLink },
});
const KNOWN_TYPES = new Set(Object.keys(schema.blockSpecs));

// Normaliseert initialContent naar BlockNote-blocks (of undefined voor leeg).
// Valt terug op string-conversie zodat oude platte-tekst entries niet crashen;
// onbekende bloktypes worden opgeschoond (zie docSchema.js).
function toBlocks(raw) {
  if (Array.isArray(raw)) {
    const blocks = sanitizeDoc(raw, KNOWN_TYPES);
    return blocks.length ? blocks : undefined;
  }
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

// Strak & relevant: afbeelding wel (lokaal, zie files.js), BlockNote's
// video-upload/audio/bestanden niet (video gaat via ons eigen blok met een
// link); dubbele uitklapkoppen weggelaten. Keys zijn stabiel los
// van de NL-vertaling.
const SLASH_KEYS = new Set([
  "paragraph",
  "heading",
  "heading_2",
  "heading_3",
  "bullet_list",
  "numbered_list",
  "check_list",
  "toggle_list",
  "toggle_heading_2",
  "quote",
  "code_block",
  "divider",
  "image",
  "table",
  "emoji",
]);

// Gecureerde opmaak-toolbar: tekststijlen, uitlijning, kleur, inspringen, link.
// Comment-knoppen weg (geen backend); bestand-knoppen tonen toch alleen bij files.
// Geen bloktype-keuze: die zit in het ⠿-menu, en BlockNote's lijst (Kop 1–6,
// uitklapbare koppen …) is op een telefoon te lang.
const TOOLBAR_KEYS = new Set([
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
  { initialContent, onChange, onOpenNote, theme },
  ref,
) {
  const [linking, setLinking] = useState(false);
  const editor = useCreateBlockNote({
    schema,
    // Afbeeldingen lokaal in Dexie (verkleind), geen server nodig.
    uploadFile: saveImage,
    resolveFileUrl,
    // Naam voor schermlezers (anders een naamloos tekstvak).
    domAttributes: { editor: { "aria-label": "Notitie" } },
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
      // Voor de disabled-staat van de knoppen. Valt bij een onbekende API terug
      // op `true` (knop enabled), zodat undo/redo nooit onterecht dood staat.
      canUndo: () => editor._tiptapEditor?.can?.().undo?.() ?? true,
      canRedo: () => editor._tiptapEditor?.can?.().redo?.() ?? true,
    }),
    [editor],
  );

  const containerRef = useRef(null);

  // Vóór BlockNote's eigen Enter-afhandeling (capture), zie editorActions.
  useEffect(() => {
    const el = containerRef.current;
    const onKey = (e) => {
      if (e.key !== "Enter" || e.shiftKey || e.isComposing) return;
      if (outdentEmptyListItem(editor)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    el?.addEventListener("keydown", onKey, true);
    return () => el?.removeEventListener("keydown", onKey, true);
  }, [editor]);

  // Eigen item achteraan (groep "Overig", net als Emoji): de datum van
  // vandaag als gewone tekst, bv. "woensdag 28 oktober 2026".
  const dateItem = {
    key: "date",
    title: "Datum van vandaag",
    aliases: ["datum", "vandaag", "date"],
    group: "Overig",
    icon: <Icon name="calendar-blank" size={18} />,
    onItemClick: () =>
      editor.insertInlineContent(fmtDate(new Date()).toLowerCase() + " "),
  };
  const linkItem = {
    key: "note_link",
    title: "Link naar notitie",
    subtext: "Verwijs naar een andere notitie",
    aliases: ["link", "notitie", "verwijzing", "koppeling"],
    group: "Overig",
    icon: <Icon name="link" size={18} />,
    onItemClick: () => setLinking(true),
  };
  const linkTo = (note) =>
    editor.insertInlineContent([
      { type: "noteLink", props: { id: note.id, title: note.title } },
      " ",
    ]);
  const insertLink = (note) => {
    setLinking(false);
    editor.focus();
    linkTo(note);
  };
  // "@" + tekst: snelle variant voor een toetsenbord (de +-knop werkt overal).
  const getNoteItems = async (query) => {
    const q = query.toLowerCase();
    return (await db.logEntries.toArray())
      .filter((e) => isActive(e) && e.title?.toLowerCase().includes(q))
      .slice(0, 8)
      .map((e) => ({ title: e.title, onItemClick: () => linkTo(e) }));
  };
  const calloutItem = {
    key: "callout",
    title: "Callout",
    subtext: "Opvallend blok: info, tip of let op",
    aliases: ["callout", "info", "tip", "let op", "opvallend"],
    group: "Overig",
    icon: <Icon name="info" size={18} />,
    onItemClick: () =>
      insertOrUpdateBlockForSlashMenu(editor, { type: "callout" }),
  };
  const videoItem = {
    key: "video_link",
    title: "Video",
    subtext: "YouTube, Instagram, Vimeo of TikTok als speler",
    aliases: ["video", "youtube", "instagram", "reel", "speler", "film"],
    group: "Media",
    icon: <Icon name="play-circle" size={18} />,
    onItemClick: () =>
      insertOrUpdateBlockForSlashMenu(editor, { type: "video" }),
  };
  // Video direct na Afbeelding: het menu toont een groepskop per aaneengesloten
  // reeks, dus elders zou "Media" twee keer verschijnen.
  const getSlashItems = async (query) =>
    filterSuggestionItems(
      [
        ...getDefaultReactSlashMenuItems(editor)
          .filter((item) => SLASH_KEYS.has(item.key))
          .flatMap((item) => (item.key === "image" ? [item, videoItem] : item)),
        linkItem,
        calloutItem,
        dateItem,
      ],
      query,
    );

  return (
    <OpenNoteContext.Provider value={onOpenNote}>
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
            // tekst komt daarna. blocksToMarkdownLossy geeft in deze BlockNote-
            // versie een string terug (geen Promise); Promise.resolve vangt beide
            // gevallen af — anders gooit `.then` bij élke wijziging een uncaught
            // fout (die o.a. de markdown-input-rules verstoorde).
            const doc = editor.document;
            onChange({ doc });
            Promise.resolve(editor.blocksToMarkdownLossy(doc)).then((text) =>
              onChange({ doc, text }),
            );
          }}
        >
          <FormattingToolbarController formattingToolbar={CuratedToolbar} />
          <SuggestionMenuController
            triggerCharacter="/"
            getItems={getSlashItems}
          />
          <SuggestionMenuController
            triggerCharacter="@"
            getItems={getNoteItems}
          />
        </BlockNoteView>
        <BlockHandle editor={editor} containerRef={containerRef} />
        <KeyboardToolbar editor={editor} />
        {linking && (
          <NoteLinkSheet
            onPick={insertLink}
            onClose={() => setLinking(false)}
          />
        )}
      </div>
    </OpenNoteContext.Provider>
  );
});

export default RichEditor;
