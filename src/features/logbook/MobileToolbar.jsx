import { useEffect, useReducer, useRef, useState } from "react";
import Emoji from "../../ui/Emoji.jsx";

// Geverifieerd tegen de geïnstalleerde BlockNote 0.51.4-typings (2026-07-03):
// node_modules/@blocknote/core/types/src/editor/BlockNoteEditor.d.ts,
// node_modules/@blocknote/core/types/src/extensions/SuggestionMenu/SuggestionMenu.d.ts,
// node_modules/@blocknote/core/types/src/blocks/defaultBlocks.d.ts.
//
// | Doel                     | API                                                              |
// | ------------------------ | ----------------------------------------------------------------- |
// | Inline-stijl togglen     | editor.toggleStyles({ bold: true })                                |
// | Actieve stijlen lezen    | editor.getActiveStyles()                                           |
// | Huidig blok bij cursor   | editor.getTextCursorPosition().block                                |
// | Bloktype wisselen        | editor.updateBlock(block, { type, props }); types: "paragraph",     |
// |                          | "heading" (props.level 1-6), "bulletListItem", "numberedListItem",  |
// |                          | "checkListItem"                                                     |
// | In-/uitspringen          | editor.nestBlock() / unnestBlock() / canNestBlock() / canUnnestBlock() |
// | Undo/redo                | editor.undo() / editor.redo() (geven boolean succes terug)          |
// | Slash-menu programmatisch| AFWIJKING van het bronplan: geen editor.openSuggestionMenu().       |
// |                          | Moet via de extensie: editor.getExtension("suggestionMenu")         |
// |                          | ?.openSuggestionMenu("/", { deleteTriggerCharacter: true }) —       |
// |                          | dit simuleert exact het typen van "/" (incl. het invoegen en later  |
// |                          | weer verwijderen van dat teken bij het kiezen van een item).        |
// | Focus                    | editor.domElement (HTMLDivElement|undefined) geeft de DOM-container;|
// |                          | focusin/focusout daarop luisteren (geen apart focus/blur-event).    |
// | Selectie-/inhoudswijziging| editor.onSelectionChange(cb) én editor.onChange(cb) bestaan beide   |
// |                          | direct (geen DOM-fallback nodig zoals het bronplan als optie gaf).  |

const BTN_BASE = {
  minWidth: 40,
  minHeight: 40,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "transparent",
  border: "none",
  borderRadius: 8,
  color: "var(--text)",
  fontSize: 14,
  fontWeight: 700,
  fontFamily: "var(--ff-body)",
  cursor: "pointer",
  flexShrink: 0,
};

function Divider() {
  return (
    <div
      style={{
        width: 1,
        alignSelf: "stretch",
        margin: "6px 2px",
        background: "var(--border-soft)",
        flexShrink: 0,
      }}
    />
  );
}

function ToolbarButton({ active, disabled, onClick, label, style, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onPointerDown={(e) => e.preventDefault()}
      onClick={onClick}
      style={{
        ...BTN_BASE,
        ...(active
          ? { background: "var(--sel-bg)", color: "var(--accent-text)" }
          : null),
        opacity: disabled ? 0.35 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// Tabelcommando's: geen nette publieke BlockNote-API in 0.51, dus via de
// onderliggende TipTap-commands (bevestigd in prosemirror-tables-typings).
// Glyphs zijn typografische tekens (net als de bestaande ✓/✕-uitzonderingen),
// behalve de prullenbak die via <Emoji> gaat.
const TABLE_ACTIONS = [
  { label: "Rij boven invoegen", glyph: "R↑", cmd: "addRowBefore" },
  { label: "Rij onder invoegen", glyph: "R↓", cmd: "addRowAfter" },
  { label: "Kolom links invoegen", glyph: "K←", cmd: "addColumnBefore" },
  { label: "Kolom rechts invoegen", glyph: "K→", cmd: "addColumnAfter" },
  { label: "Rij wissen", glyph: "R✕", cmd: "deleteRow" },
  { label: "Kolom wissen", glyph: "K✕", cmd: "deleteColumn" },
  { label: "Kopregel aan/uit", glyph: "▤", cmd: "toggleHeaderRow" },
];

const HEADING_LEVELS = [1, 2, 3];
const STYLE_BUTTONS = [
  { key: "bold", label: "Vet", glyph: "B", style: { fontWeight: 800 } },
  {
    key: "italic",
    label: "Cursief",
    glyph: "I",
    style: { fontStyle: "italic" },
  },
  {
    key: "underline",
    label: "Onderstreept",
    glyph: "U",
    style: { textDecoration: "underline" },
  },
  {
    key: "strike",
    label: "Doorgehaald",
    glyph: "S",
    style: { textDecoration: "line-through" },
  },
];

// Vaste werkbalk boven het virtuele toetsenbord, alleen op touch-apparaten.
// Vervangt op touch de zwevende opmaakbalk en het typen van "/": alle acties
// gaan via de programmatische BlockNote-API i.p.v. hover/typ-triggers.
export default function MobileToolbar({ editor }) {
  const [isTouch] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: coarse)").matches,
  );
  const [visible, setVisible] = useState(false);
  const [, forceUpdate] = useReducer((n) => n + 1, 0);
  const toolbarRef = useRef(null);
  const hideTimer = useRef(null);

  // Zichtbaarheid volgt editor-focus (met een korte marge zodat een tap op de
  // werkbalk zelf 'm niet sluit — onPointerDown/preventDefault op de knoppen
  // voorkomt meestal al dat de editor focus verliest, dit is het vangnet).
  useEffect(() => {
    if (!isTouch || !editor) return;
    const el = editor.domElement;
    if (!el) return;
    const onFocusIn = () => {
      clearTimeout(hideTimer.current);
      setVisible(true);
    };
    const onFocusOut = () => {
      hideTimer.current = setTimeout(() => setVisible(false), 100);
    };
    el.addEventListener("focusin", onFocusIn);
    el.addEventListener("focusout", onFocusOut);
    return () => {
      el.removeEventListener("focusin", onFocusIn);
      el.removeEventListener("focusout", onFocusOut);
      clearTimeout(hideTimer.current);
    };
  }, [isTouch, editor]);

  // Actieve-knop-state meebewegen met cursor/inhoud.
  useEffect(() => {
    if (!isTouch || !editor) return;
    const unsubSel = editor.onSelectionChange(() => forceUpdate());
    const unsubChange = editor.onChange(() => forceUpdate());
    return () => {
      unsubSel?.();
      unsubChange?.();
    };
  }, [isTouch, editor]);

  // Balk boven het virtuele toetsenbord houden via de VisualViewport-API.
  useEffect(() => {
    if (!isTouch) return;
    const vv = window.visualViewport;
    const el = toolbarRef.current;
    if (!vv || !el) return;
    const update = () => {
      const offset = window.innerHeight - vv.height - vv.offsetTop;
      el.style.transform = `translateY(${-Math.max(0, offset)}px)`;
    };
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    update();
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, [isTouch]);

  if (!isTouch) return null;

  const block = editor.getTextCursorPosition()?.block;
  const activeStyles = editor.getActiveStyles();

  const setBlockType = (type, props) => {
    if (!block) return;
    editor.updateBlock(block, props ? { type, props } : { type });
  };
  const toggleListType = (type) => {
    if (!block) return;
    editor.updateBlock(block, {
      type: block.type === type ? "paragraph" : type,
    });
  };
  const openSlashMenu = () => {
    editor
      .getExtension("suggestionMenu")
      ?.openSuggestionMenu("/", { deleteTriggerCharacter: true });
  };

  return (
    <div
      ref={toolbarRef}
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 260,
        display: visible ? "flex" : "none",
        alignItems: "center",
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
        background: "var(--card)",
        borderTop: "1px solid var(--border)",
        padding: "4px 6px",
        gap: 2,
      }}
    >
      <ToolbarButton label="Invoegen" onClick={openSlashMenu}>
        +
      </ToolbarButton>
      <Divider />
      <ToolbarButton
        label="Tekst"
        active={block?.type === "paragraph"}
        onClick={() => setBlockType("paragraph")}
      >
        T
      </ToolbarButton>
      {HEADING_LEVELS.map((level) => (
        <ToolbarButton
          key={level}
          label={`Kop ${level}`}
          active={block?.type === "heading" && block?.props?.level === level}
          onClick={() => setBlockType("heading", { level })}
        >
          H{level}
        </ToolbarButton>
      ))}
      <Divider />
      {STYLE_BUTTONS.map((s) => (
        <ToolbarButton
          key={s.key}
          label={s.label}
          active={!!activeStyles[s.key]}
          onClick={() => editor.toggleStyles({ [s.key]: true })}
          style={s.style}
        >
          {s.glyph}
        </ToolbarButton>
      ))}
      <Divider />
      <ToolbarButton
        label="Checklist"
        active={block?.type === "checkListItem"}
        onClick={() => toggleListType("checkListItem")}
      >
        ☑
      </ToolbarButton>
      <ToolbarButton
        label="Opsomming"
        active={block?.type === "bulletListItem"}
        onClick={() => toggleListType("bulletListItem")}
      >
        •
      </ToolbarButton>
      <ToolbarButton
        label="Genummerde lijst"
        active={block?.type === "numberedListItem"}
        onClick={() => toggleListType("numberedListItem")}
      >
        1.
      </ToolbarButton>
      <Divider />
      <ToolbarButton
        label="Uitspringen"
        disabled={!editor.canUnnestBlock()}
        onClick={() => editor.unnestBlock()}
      >
        ⇤
      </ToolbarButton>
      <ToolbarButton
        label="Inspringen"
        disabled={!editor.canNestBlock()}
        onClick={() => editor.nestBlock()}
      >
        ⇥
      </ToolbarButton>
      <Divider />
      <ToolbarButton label="Ongedaan maken" onClick={() => editor.undo()}>
        ↶
      </ToolbarButton>
      <ToolbarButton label="Opnieuw" onClick={() => editor.redo()}>
        ↷
      </ToolbarButton>
      {block?.type === "table" && (
        <>
          <Divider />
          {TABLE_ACTIONS.map((a) => (
            <ToolbarButton
              key={a.cmd}
              label={a.label}
              onClick={() => editor._tiptapEditor.commands[a.cmd]()}
            >
              {a.glyph}
            </ToolbarButton>
          ))}
          <ToolbarButton
            label="Tabel wissen"
            onClick={() => editor._tiptapEditor.commands.deleteTable()}
          >
            <Emoji char="🗑️" size={14} />
          </ToolbarButton>
        </>
      )}
    </div>
  );
}
