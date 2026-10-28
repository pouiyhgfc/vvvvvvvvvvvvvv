import { useEffect, useState } from "react";
import Icon from "../../ui/Icon.jsx";
import {
  indent,
  openSlashMenu,
  outdent,
  toggleBlockType,
  toggleStyle,
} from "./editorActions.js";

// Vaste balk onderin zolang je typt: op een telefoon zit hij boven het
// toetsenbord (de viewport krimpt mee, zie interactive-widget in index.html).
// Zo kun je opmaken en inspringen zonder eerst tekst te selecteren en zonder
// Tab-toets. Elke knop houdt de focus in de editor (preventDefault op
// pointerdown), anders klapt het toetsenbord in.
export default function KeyboardToolbar({ editor }) {
  const [state, setState] = useState(null);

  useEffect(() => {
    if (!editor) return undefined;
    const root = editor.domElement;
    const read = () => {
      if (!root?.contains(document.activeElement)) return setState(null);
      const block = editor.getTextCursorPosition()?.block;
      const styles = editor.getActiveStyles();
      setState({
        type: block?.type,
        bold: !!styles.bold,
        italic: !!styles.italic,
        canNest: editor.canNestBlock(),
        canUnnest: editor.canUnnestBlock(),
      });
    };
    // Bij focus-wissel even wachten: de nieuwe activeElement staat pas na
    // het event vast.
    const later = () => setTimeout(read, 0);
    const unsubSel = editor.onSelectionChange(read);
    const unsubChange = editor.onChange(read);
    root?.addEventListener("focusin", later);
    root?.addEventListener("focusout", later);
    return () => {
      unsubSel?.();
      unsubChange?.();
      root?.removeEventListener("focusin", later);
      root?.removeEventListener("focusout", later);
    };
  }, [editor]);

  if (!state) return null;

  const run = (fn) => () => {
    fn();
    editor.focus();
  };
  const buttons = [
    {
      icon: "plus",
      label: "Blok invoegen",
      onClick: () => openSlashMenu(editor),
    },
    {
      icon: "list-checks",
      label: "Checklist",
      on: state.type === "checkListItem",
      onClick: run(() => toggleBlockType(editor, "checkListItem")),
    },
    {
      icon: "list-bullets",
      label: "Opsomming",
      on: state.type === "bulletListItem",
      onClick: run(() => toggleBlockType(editor, "bulletListItem")),
    },
    {
      icon: "list-numbers",
      label: "Genummerde lijst",
      on: state.type === "numberedListItem",
      onClick: run(() => toggleBlockType(editor, "numberedListItem")),
    },
    {
      icon: "text-b",
      label: "Vet",
      on: state.bold,
      onClick: run(() => toggleStyle(editor, "bold")),
    },
    {
      icon: "text-italic",
      label: "Cursief",
      on: state.italic,
      onClick: run(() => toggleStyle(editor, "italic")),
    },
    {
      icon: "text-outdent",
      label: "Uitspringen",
      disabled: !state.canUnnest,
      onClick: run(() => outdent(editor)),
    },
    {
      icon: "text-indent",
      label: "Inspringen",
      disabled: !state.canNest,
      onClick: run(() => indent(editor)),
    },
    {
      icon: "caret-line-down",
      label: "Toetsenbord sluiten",
      onClick: () => document.activeElement?.blur(),
    },
  ];

  return (
    <div
      role="toolbar"
      aria-label="Opmaak"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 260,
        background: "var(--card)",
        borderTop: "1px solid var(--border-soft)",
        padding: "4px 4px calc(4px + env(safe-area-inset-bottom))",
        display: "flex",
        justifyContent: "space-around",
      }}
    >
      {buttons.map((b) => (
        <button
          key={b.label}
          type="button"
          aria-label={b.label}
          aria-pressed={b.on ?? undefined}
          disabled={b.disabled}
          onPointerDown={(e) => e.preventDefault()}
          onClick={b.onClick}
          style={{
            width: 40,
            height: 44,
            borderRadius: "var(--r-sm)",
            border: "none",
            background: b.on ? "var(--accent-bg)" : "transparent",
            color: b.on
              ? "var(--accent-text)"
              : b.icon === "plus"
                ? "var(--accent)"
                : "var(--text)",
            opacity: b.disabled ? 0.3 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
          }}
        >
          <Icon name={b.icon} size={22} />
        </button>
      ))}
    </div>
  );
}
