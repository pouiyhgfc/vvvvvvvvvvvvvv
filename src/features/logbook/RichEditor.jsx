import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
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

export default function RichEditor({ initialContent, onChange, theme }) {
  const editor = useCreateBlockNote({
    initialContent: toBlocks(initialContent),
  });
  return (
    <div className="bn-container">
      <BlockNoteView
        editor={editor}
        theme={theme === "dark" ? "dark" : "light"}
        style={EVERGREEN_TOKENS}
        onChange={async () => {
          const doc = editor.document;
          const text = await editor.blocksToMarkdownLossy(doc);
          onChange({ doc, text });
        }}
      />
    </div>
  );
}
