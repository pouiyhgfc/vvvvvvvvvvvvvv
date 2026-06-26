import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

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

export default function RichEditor({ initialContent, onChange, theme }) {
  const editor = useCreateBlockNote({
    initialContent: toBlocks(initialContent),
  });
  return (
    <BlockNoteView
      editor={editor}
      theme={theme === "dark" ? "dark" : "light"}
      onChange={async () => {
        const doc = editor.document;
        const text = await editor.blocksToMarkdownLossy(doc);
        onChange({ doc, text });
      }}
    />
  );
}
